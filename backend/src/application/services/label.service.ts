import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const LABEL_W = 180;
const LABEL_H = 130;
const COLS = 3;
const PAGE_MARGIN = 36;
const LABEL_PAD = 8;

async function qrCodePng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, { type: 'png', margin: 1, width: 80 });
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

  const doc = new PDFDocument({ autoFirstPage: false, margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const rows = Math.ceil(quantity / COLS);
  const pageH = PAGE_MARGIN * 2 + rows * LABEL_H;
  doc.addPage({ size: [PAGE_MARGIN * 2 + COLS * LABEL_W, pageH] });

  for (let i = 0; i < quantity; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAGE_MARGIN + col * LABEL_W + LABEL_PAD;
    const y = PAGE_MARGIN + row * LABEL_H + LABEL_PAD;
    const innerW = LABEL_W - LABEL_PAD * 2;

    doc
      .rect(
        PAGE_MARGIN + col * LABEL_W,
        PAGE_MARGIN + row * LABEL_H,
        LABEL_W,
        LABEL_H,
      )
      .stroke('#cccccc');

    const qrSize = 54;
    doc.image(qrBuf, x, y, { width: qrSize, height: qrSize });

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(sku, x + qrSize + 4, y, {
        width: innerW - qrSize - 4,
        lineBreak: false,
      });

    const shortY = y + 12;
    doc
      .font('Helvetica')
      .fontSize(7)
      .text(shortName, x + qrSize + 4, shortY, {
        width: innerW - qrSize - 4,
        lineBreak: true,
        height: 28,
        ellipsis: true,
      });

    const barW = innerW;
    const barH = 24;
    const barY = y + qrSize + 4;
    doc.image(barBuf, x, barY, { width: barW, height: barH });

    doc
      .font('Helvetica')
      .fontSize(6)
      .text(sku, x, barY + barH + 1, { width: barW, align: 'center' });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
