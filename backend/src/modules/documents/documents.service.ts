import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentStatus, User } from 'src/generated/prisma/client';
import { keccak256, verifyMessage } from 'ethers';
import { readFileSync } from 'node:fs';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) { }

  async create(file: Express.Multer.File & { hash: string }, user: User) {
    const document = await this.prisma.document.create({
      data: {
        name: file.originalname,
        storageUrl: file.path,
        documentHash: file.hash,
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
    return document;
  }

  async list(user: User) {
    return this.prisma.document.findMany({
      where: {
        ownerId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: User) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!doc || doc.ownerId !== user.id) {
      throw new NotFoundException();
    }
    return doc;
  }

  async verify(id: string, user: User) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { signature: { include: { signer: true } } },
    });
    if (!doc || doc.ownerId !== user.id) {
      throw new NotFoundException();
    }
    const fileBuffer = readFileSync(doc.storageUrl);
    const recalculatedHash = keccak256(fileBuffer);
    const hashValid = recalculatedHash === doc.documentHash;
    if (!doc.signature) {
      return {
        hashValid,
        status: doc.status,
        documentHash: doc.documentHash,
      };
    }
    const recoveredAddr = verifyMessage(doc.documentHash, doc.signature.signatureHex);
    const signatureValid = recoveredAddr.toLowerCase() === doc.signature.signer.walletAddress.toLowerCase();
    return {
      hashValid,
      signatureValid,
      status: doc.status,
      documentHash: doc.documentHash,
      signer: doc.signature.signer.walletAddress,
    };
  }

  async verifyOnChain(id: string, user: User) {
    const doc = await this.findOne(id, user);
    const anchored = await this.blockchainService.isAnchored(doc.documentHash);
    return { anchored };
  }

  async sign(id: string, signature: string, user: User) {
    if (!signature) {
      throw new BadRequestException('Missing signature')
    }
    const doc = await this.findOne(id, user);
    if (doc.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException('Document already signed');
    }
    const recovered = verifyMessage(doc.documentHash, signature);
    if (recovered.toLowerCase() !== user.walletAddress.toLowerCase()) {
      throw new UnauthorizedException('Addresses unmatched');
    }
    const sig = await this.prisma.signature.create({
      data: {
        documentId: doc.id,
        signerId: user.id,
        signatureHex: signature,
      },
    });
    if (!sig?.id) throw new InternalServerErrorException();
    await this.prisma.document.update({
      where: { id: doc.id },
      data: { status: 'SIGNED' },
    });
    return sig;
  }

  async anchor(id: string, user: User) {
    const doc = await this.findOne(id, user);
    if (doc.blockchainTxHash && doc.status === DocumentStatus.ANCHORED) {
      throw new BadRequestException('Already anchored');
    } else {
      if (doc.status !== DocumentStatus.SIGNED) {
        throw new BadRequestException('Must be signed first');
      }
    }

    const anchorResult = await this.blockchainService.anchorDocument(
      doc.id,
      doc.documentHash,
    );
    if (!anchorResult) {
      throw new InternalServerErrorException('Anchor failed');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.ANCHORED,
        blockchainTxHash: anchorResult.txHash,
        anchoredAt: new Date(anchorResult.anchoredAt * 1000),
      },
      select: {
        id: true,
        blockchainTxHash: true,
        anchoredAt: true,
        status: true,
      }
    });
  }

  update(id: string, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }

  async remove(id: string, user: User) {
    const doc = await this.findOne(id, user);
    return await this.prisma.document.delete({
      where: { id: doc.id },
    });
  }
}
