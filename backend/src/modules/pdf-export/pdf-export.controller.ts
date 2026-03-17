import { type Response } from 'express';
import { PdfExportService } from './pdf-export.service';
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { ActionLog } from 'src/decorators/action-log.decorator';
import { ActionType } from 'src/generated/prisma/enums';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('pdf-export')
@UseGuards(JwtAuthGuard)
export class PdfExportController {
  constructor(
    private readonly documentService: DocumentsService,
    private readonly pdfExportService: PdfExportService,
  ) { }

  @Get(':documentId/export')
  @ActionLog({
    action: ActionType.DOCUMENT_EXPORT,
    entity: 'document',
    getEntityId: (req, _) => req.params.documentId,
  })
  async exportDocumentToPDF(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const doc = await this.documentService.getDocumentWithSigners(documentId);
    const verifyUrl = `${process.env.APP_BASE_URL}/verify/${documentId}`;
    const signatures = doc.signers.map(s => ({
      name: s.user.username,
      wallet: s.signedWalletAddress || '',
      proof: s.merkleProof as string[] || [],
      image: undefined, // TODO: add signature image if available
    }));

    const pdf = await this.pdfExportService.exportSignedPdf(
      {
        merkleRoot: doc.merkleRoot || '',
        txHash: doc.blockchainTxHash || '',
        documentHash: doc.documentHash || '',
      },
      doc.storageUrl,
      signatures,
      verifyUrl,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="signed-${documentId}.pdf"`
    });

    res.send(pdf);
  }
}
