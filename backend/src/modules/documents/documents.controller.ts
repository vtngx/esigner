import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DocumentsService } from './documents.service';
import { FileHashPipe } from 'src/pipes/file-hash.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActionType, User, Wallet } from 'src/generated/prisma/client';
import { AssignSignersDto } from './dto/assign-signers.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ActionLog } from 'src/decorators/action-log.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Invalid file type'),
          false,
        );
      }
      callback(null, true);
    },
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
  }))
  @ActionLog({
    action: ActionType.DOCUMENT_CREATE,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
    getMetadata: (_, res) => ({ name: res.name, documentHash: res.documentHash }),
  })
  async upload(
    @Request() req: { user: User },
    @UploadedFile(new FileHashPipe()) file: Express.Multer.File & { hash: string },
  ) {
    return this.documentsService.create(file, req.user);
  }

  @Post(':id/signers')
  @ActionLog({
    action: ActionType.DOCUMENT_UPDATE_SIGNER,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
    getMetadata: (req, _) => ({ signers: req.body.signerUsernames }),
  })
  async assignSigners(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() body: AssignSignersDto,
  ) {
    return this.documentsService.assignSigners(id, body, req.user);
  }

  @Post(':id/sign')
  @ActionLog({
    action: ActionType.DOCUMENT_SIGN,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
    getMetadata: (_, res) => ({
      signatureHex: res.signatureHex,
      signedAt: res.signedAt,
      signedWalletAddress: res.signedWalletAddress,
      merkleProof: res.merkleProof,
    }),
  })
  async sign(
    @Param('id') id: string,
    @Request() req: { user: User & { wallets: Wallet[] } },
    @Body('signature') signature: string,
  ) {
    return this.documentsService.sign(id, signature, req.user);
  }

  @Post(':id/anchor')
  @ActionLog({
    action: ActionType.DOCUMENT_ANCHOR,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
    getMetadata: (_, res) => ({
      merkleRoot: res.merkleRoot,
      blockchainTxHash: res.blockchainTxHash,
      anchoredAt: res.anchoredAt,
    }),
  })
  async anchor(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.anchor(id, req.user);
  }

  @Get()
  async list(
    @Query() query: PaginationQueryDto,
    @Request() req: { user: User },
  ) {
    return this.documentsService.list(req.user);
  }

  @Get('dashboard')
  async dashboard(@Request() req: { user: User }) {
    return this.documentsService.getSummary(req.user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.findOne(id, req.user);
  }

  @Get(':id/verify')
  @ActionLog({
    action: ActionType.DOCUMENT_VERIFY,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
    getMetadata: (_, res) => res,
  })
  async verifyIntegrity(@Param('id') id: string) {
    return this.documentsService.verify(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @ActionLog({
    action: ActionType.DOCUMENT_DELETE,
    entity: 'document',
    getEntityId: (_, res) => res?.id,
  })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.remove(id, req.user);
  }
}
