import { type Response } from 'express';
import { PdfExportService } from './pdf-export.service';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';

@Controller('pdf-export')
export class PdfExportController {
  constructor(
    private readonly documentService: DocumentsService,
    private readonly pdfExportService: PdfExportService,
  ) { }

  @Get(':documentId/export')
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
