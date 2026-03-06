import { Module } from '@nestjs/common';
import { PdfExportService } from './pdf-export.service';
import { PdfExportController } from './pdf-export.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [PdfExportController],
  providers: [PdfExportService],
})
export class PdfExportModule {}
