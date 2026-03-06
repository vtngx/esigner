import { Injectable } from '@nestjs/common';
import { promises } from 'node:fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';

@Injectable()
export class PdfExportService {
  async exportSignedPdf(
    docMetadata: {
      merkleRoot: string;
      txHash: string;
      documentHash: string;
    },
    filePath: string,
    signatures: {
      name: string;
      image?: Buffer;
      wallet: string;
      proof: string[];
    }[],
    verifyUrl: string,
  ) {
    // Load existing PDF
    const existingPdf = await promises.readFile(filePath);
    const pdfDoc = await PDFDocument.load(existingPdf);
    pdfDoc.setSubject(JSON.stringify(docMetadata));
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add a new page for verification details
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 60;

    // Title
    page.drawText('Document Verification', { x: 50, y, size: 20, font: boldFont });
    y -= 40;
    // Metadata
    page.drawText(`Document Hash: ${docMetadata.documentHash}`, { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(`Merkle Root: ${docMetadata.merkleRoot}`, { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(`Transaction: ${docMetadata.txHash}`, { x: 50, y, size: 10, font });
    y -= 40;
    // Signatures section
    page.drawText('Signatures', { x: 50, y, size: 14, font: boldFont });
    y -= 30;
    for (const sig of signatures) {
      page.drawText(`Name: ${sig.name}`, { x: 50, y, size: 10, font });
      page.drawText(`Wallet: ${sig.wallet}`, { x: 50, y: y - 15, size: 9, font });
      page.drawText(`Merkle proof nodes: ${sig.proof.length}`, { x: 50, y: y - 30, size: 8, font });
      if (sig.image) {
        const png = await pdfDoc.embedPng(sig.image);
        page.drawImage(png, { x: width - 200, y: y - 20, width: 120, height: 40 });
      }
      y -= 80;
    }
    // Generate QR
    const qrBuffer = await QRCode.toBuffer(verifyUrl);
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, { x: width - 150, y: 80, width: 100, height: 100 });
    page.drawText('Scan to verify', { x: width - 150, y: 65, size: 10, font, color: rgb(0, 0, 0) });
    page.drawText(verifyUrl, { x: 50, y: 80, size: 9, font });
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
  }
}
