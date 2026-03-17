import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { keccak256, verifyMessage } from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignSignersDto } from './dto/assign-signers.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { createLeaf, generateMerkleRoot, verifyProof } from 'src/helpers/crypto';
import { Document, DocumentStatus, Signer, User, Wallet } from 'src/generated/prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) { }

  async getSummary(user: User) {
    const owned = await this.prisma.document.count({
      where: { ownerId: user.id },
    });
    // count documents where user is a signer and has not signed yet
    const assigned = await this.prisma.document.count({
      where: {
        signers: {
          some: {
            userId: user.id,
            signatureHex: null,
          },
        },
      },
    });
    // count documents where user is a signer and has signed
    const signed = await this.prisma.document.count({
      where: {
        signers: {
          some: {
            userId: user.id,
            signatureHex: { not: null },
          },
        },
      },
    });
    return {
      owned,
      assigned,
      signed,
    };
  }

  async create(file: Express.Multer.File & { hash: string }, user: User): Promise<Document> {
    const document = await this.prisma.document.create({
      data: {
        name: file.originalname,
        storageUrl: file.path,
        documentHash: file.hash,
        ownerId: user.id,
      },
    });
    return document;
  }

  async assignSigners(id: string, body: AssignSignersDto, user: User) {
    if (body.signerUsernames.length === 0) {
      throw new BadRequestException('Must provide at least one signer');
    }
    if (body.signerUsernames.some(username => username.trim() === '')) {
      throw new BadRequestException('Signer usernames cannot be empty');
    }
    // validate document exists, user is owner, and document is in draft status
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!doc || doc.ownerId !== user.id) {
      throw new NotFoundException();
    }
    if (doc.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Can only assign signers to draft documents');
    }
    if (new Set(body.signerUsernames).size !== body.signerUsernames.length) {
      throw new BadRequestException('Duplicate signer usernames provided');
    }
    // validate signers exist and have connected wallets
    const signerUserData = await this.prisma.user.findMany({
      where: { username: { in: body.signerUsernames } },
      include: { wallets: true },
    });
    const nonExistentSigners = body.signerUsernames.filter(username => !signerUserData.some(u => u.username === username));
    if (nonExistentSigners.length > 0) {
      throw new BadRequestException(`Users with usernames ${nonExistentSigners.join(', ')} do not exist`);
    }
    const invalidSigners = signerUserData.filter(u => u.wallets.length === 0).map(u => u.username);
    if (invalidSigners.length > 0) {
      throw new BadRequestException(`Users ${invalidSigners.join(', ')} have no connected wallet`);
    }
    // create signer entries
    const signers = await this.prisma.signer.createMany({
      data: signerUserData.map(u => ({
        documentId: doc.id,
        userId: u.id,
      })),
    });
    return {
      id: doc.id,
      signersCount: signers.count,
    };
  }

  async list(user: User): Promise<(Document & { isOwner?: boolean, isSigner?: boolean })[]> {
    const docs = await this.prisma.document.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { signers: { some: { userId: user.id } } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, username: true } },
        signers: { include: { user: true } },
      },
    });
    return docs.map(d => {
      return {
        ...d,
        isOwner: d.ownerId === user.id,
        isSigner: !!d.signers?.some(s => s.userId === user.id),
      };
    });
  }

  async findOne(id: string, user: User) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, username: true, wallets: { select: { address: true, createdAt: true } } },
        },
        signers: {
          select: { id: true, signatureHex: true, signedAt: true, signedWalletAddress: true, merkleProof: true, userId: true },
        }
      },
    });
    // only allow access if user is owner or assigned signer
    if (!doc || (doc.ownerId !== user.id && !doc?.signers?.some(s => s.userId === user.id))) {
      throw new NotFoundException();
    }
    return doc;
  }

  async getDocumentWithSigners(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        signers: {
          include: {
            user: { select: { id: true, username: true, wallets: { select: { address: true } } } },
          }
        }
      },
    });
    if (!doc) {
      throw new NotFoundException();
    }
    return doc;
  }

  async sign(id: string, signature: string, user: User & { wallets: Wallet[] }): Promise<Signer> {
    if (!signature) {
      throw new BadRequestException('Missing signature')
    }
    // validate document exists and not fully signed or anchored already
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException();
    }
    if (doc.status === DocumentStatus.SIGNED || doc.status === DocumentStatus.ANCHORED) {
      throw new BadRequestException('Document already signed');
    }
    // validate user is an assigned signer
    const signerData = await this.prisma.signer.findFirst({
      where: { documentId: doc.id, userId: user.id },
    });
    if (!signerData) {
      throw new ForbiddenException('Not an assigned signer');
    }
    if (!!signerData.signedAt || !!signerData.signatureHex) {
      throw new BadRequestException('Already signed');
    }
    // validate signature matches document hash and signer wallet
    const recoveredAddress = verifyMessage(doc.documentHash, signature);
    if (!user.wallets.some(wallet => wallet.address.toLowerCase() === recoveredAddress.toLowerCase())) {
      throw new ForbiddenException('Signature does not match any connected wallet');
    }
    // store signature and update document status
    const updatedSigner = await this.prisma.signer.update({
      where: { id: signerData.id },
      data: {
        signedWalletAddress: recoveredAddress,
        signatureHex: signature,
        signedAt: new Date(),
      },
    });
    if (!updatedSigner?.signatureHex || !updatedSigner?.signedAt) {
      throw new InternalServerErrorException();
    }
    const pendingSigners = await this.prisma.signer.count({
      where: {
        documentId: doc.id,
        signatureHex: null
      }
    });
    if (pendingSigners === 0) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.SIGNED },
      });
    } else if (doc.status === DocumentStatus.DRAFT) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.SIGNING },
      });
    }
    return updatedSigner;
  }

  async anchor(id: string, user: User) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { signers: true },
    });
    if (!doc) {
      throw new NotFoundException();
    }
    if (doc.ownerId !== user.id) {
      throw new ForbiddenException('Only owner can anchor document');
    }
    if (doc.blockchainTxHash && doc.status === DocumentStatus.ANCHORED) {
      throw new BadRequestException('Already anchored');
    } else {
      if (doc.status !== DocumentStatus.SIGNED) {
        throw new BadRequestException('Must be signed first');
      }
    }
    // ensure all signers have signed
    const signers: Signer[] = doc.signers.filter((s) => !!s.signatureHex && !!s.signedWalletAddress);
    if (signers.length < doc.signers.length) {
      throw new BadRequestException('Cannot anchor partially signed document');
    }
    // generate merkle root from signed signers
    const leaves = signers.map(s => createLeaf(doc.documentHash, s.signedWalletAddress as string));
    const { root, tree } = generateMerkleRoot(leaves);
    const txHash = await this.blockchainService.anchorRoot(root);
    if (!txHash) {
      throw new InternalServerErrorException('Anchor failed');
    }
    // store merkle proof for each signer
    await Promise.all(
      signers.map((signer) => {
        const leaf = createLeaf(doc.documentHash, signer.signedWalletAddress as string);
        const merkleProof = tree.getHexProof(leaf);
        return this.prisma.signer.update({
          where: { id: signer.id },
          data: { merkleProof },
        });
      }),
    );
    // update document with anchor info
    return this.prisma.document.update({
      where: { id: doc.id },
      data: {
        merkleRoot: root,
        blockchainTxHash: txHash,
        status: DocumentStatus.ANCHORED,
        anchoredAt: new Date(),
      },
      select: {
        id: true,
        merkleRoot: true,
        blockchainTxHash: true,
        status: true,
        anchoredAt: true,
      }
    });
  }

  async verify(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { signers: { include: { user: { include: { wallets: true } } } } },
    });
    if (!doc) {
      throw new NotFoundException();
    }
    // recalculate hash and compare to stored hash
    const fileBuffer = readFileSync(doc.storageUrl);
    const recalculatedHash = keccak256(fileBuffer);
    const hashValid = recalculatedHash === doc.documentHash;
    // summarize signer status
    const signedSigners = doc.signers.filter(s => s.signatureHex);
    const signersStatus = `${signedSigners.length}/${doc.signers.length} signatures`;
    // if document has merkle root, verify against blockchain
    const anchored = doc.merkleRoot
      ? await this.blockchainService.verifyRoot(doc.merkleRoot)
      : false;
    // verify each signature and recover wallet to compare against user's connected wallets
    const signatureChecks = doc.signers.map((s) => {
      if (!s.signatureHex) {
        return {
          signer: s.user.username,
          signatureValid: false,
          merkleProofValid: false,
          wallet: null as (string | null),
          signedAt: null as (Date | null),
          reason: "NOT_SIGNED"
        };
      }
      const recoveredWallet = verifyMessage(doc.documentHash, s.signatureHex);
      const userWallets = s.user.wallets.map(w => w.address.toLowerCase());
      const signatureValid = userWallets.includes(recoveredWallet.toLowerCase());
      const merkleProofValid = doc.status === DocumentStatus.ANCHORED ? verifyProof(
        createLeaf(doc.documentHash, recoveredWallet),
        s.merkleProof as string[],
        doc.merkleRoot as string,
      ) : false;
      return {
        signer: s.user.username,
        signatureValid,
        merkleProofValid,
        wallet: recoveredWallet,
        signedAt: s.signedAt,
        reason: doc.status !== DocumentStatus.ANCHORED ? 'NOT_ANCHORED' : '',
      };
    });
    // if document has merkle root but is not anchored, update status back to signed to allow re-anchoring
    if (
      (doc.merkleRoot && doc.status === DocumentStatus.ANCHORED && !anchored) ||
      (!doc.signers.length && doc.status !== DocumentStatus.DRAFT) ||
      signedSigners.length !== doc.signers.length
    ) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: {
          status: !doc.signers?.length
            ? DocumentStatus.DRAFT
            : (signedSigners.length !== doc.signers.length)
              ? DocumentStatus.SIGNING
              : DocumentStatus.SIGNED,
          blockchainTxHash: null,
          anchoredAt: null,
        },
      });
    }

    return {
      doc: {
        id: doc.id,
        status: doc.status,
        hash: doc.documentHash,
        hashValid,
      },
      blockchain: {
        anchored,
        merkleRoot: doc.merkleRoot,
        txHash: doc.blockchainTxHash,
      },
      signatures: {
        status: signersStatus,
        details: signatureChecks,
      }
    };
  }

  update(id: string, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }

  async remove(id: string, user: User) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { signers: true },
    });
    // only allow deletion if user is owner and document is not anchored
    if (!doc || doc.ownerId !== user.id) {
      throw new NotFoundException();
    }
    if (doc.status === DocumentStatus.ANCHORED) {
      throw new BadRequestException('Cannot delete ANCHORED documents');
    }
    await this.prisma.signer.deleteMany({
      where: { documentId: doc.id },
    })
    await unlink(doc.storageUrl);
    return await this.prisma.document.delete({
      where: { id: doc.id },
    });
  }
}
