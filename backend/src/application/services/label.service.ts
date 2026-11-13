import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// A4 sheet dimensions in points
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 25;
const MARGIN_Y = 25;
const COLS = 3;
const ROWS = 7;
const LABELS_PER_PAGE = COLS * ROWS; // 21 labels per page
const GAP_X = 10;
const GAP_Y = 10;
const LABEL_W = (PAGE_W - MARGIN_X * 2 - GAP_X * (COLS - 1)) / COLS;
const LABEL_H = (PAGE_H - MARGIN_Y * 2 - GAP_Y * (ROWS - 1)) / ROWS;
const PAD = 7;

async function qrCodePng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, { type: 'png', margin: 1, width: 92 });
}

async function barcodePng(text: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 2,
    height: 10,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  });
}

export async function generateLabelPdf(
  sku: string,
  shortName: string,
  quantity: number,
): Promise<Buffer> {
  const [qrBuf, barBuf] = await Promise.all([qrCodePng(sku), barcodePng(sku)]);

  const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  for (let i = 0; i < quantity; i++) {
    if (i % LABELS_PER_PAGE === 0) {
      doc.addPage({ size: 'A4', margin: 0 });
    }

    const pageIdx = i % LABELS_PER_PAGE;
    const col = pageIdx % COLS;
    const row = Math.floor(pageIdx / COLS);

    const x = MARGIN_X + col * (LABEL_W + GAP_X);
    const y = MARGIN_Y + row * (LABEL_H + GAP_Y);

    // Border around label
    doc.rect(x, y, LABEL_W, LABEL_H).lineWidth(0.5).stroke('#d1d5db');

    // QR Code
    const qrSize = 46;
    const qrX = x + PAD;
    const qrY = y + PAD;
    doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });

    // Top Right Info
    const textX = qrX + qrSize + 6;
    const textW = LABEL_W - (qrSize + PAD * 2 + 6);

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(sku, textX, qrY, { width: textW, lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#4b5563')
      .text(shortName, textX, qrY + 13, {
        width: textW,
        height: 26,
        ellipsis: true,
        lineBreak: true,
      });

    // Barcode
    const barW = LABEL_W - PAD * 2;
    const barH = 22;
    const barY = qrY + qrSize + 5;
    doc.image(barBuf, x + PAD, barY, { width: barW, height: barH });

    // SKU under barcode
    const skuBottomY = barY + barH + 2;
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor('#374151')
      .text(sku, x + PAD, skuBottomY, {
        width: barW,
        align: 'center',
        lineBreak: false,
      });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
