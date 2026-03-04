import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DocumentsService } from './documents.service';
import { FileHashPipe } from 'src/pipes/file-hash.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';

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
  async upload(
    @Request() req: { user: User },
    @UploadedFile(new FileHashPipe()) file: Express.Multer.File & { hash: string },
  ) {
    return this.documentsService.create(file, req.user);
  }

  @Post(':id/sign')
  async sign(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body('signature') signature: string,
  ) {
    return this.documentsService.sign(id, signature, req.user);
  }

  @Post(':id/anchor')
  async anchor(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.anchor(id, req.user);
  }

  @Get()
  async list(@Request() req: { user: User }) {
    return this.documentsService.list(req.user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.findOne(id, req.user);
  }

  @Get(':id/verify')
  async verifyIntegrity(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.verify(id, req.user);
  }

  @Get(':id/onchain')
  async verifyOnChain(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.verifyOnChain(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.documentsService.remove(id, req.user);
  }
}
