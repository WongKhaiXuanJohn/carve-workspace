import { formatMoney } from './receipt.js';

// Render locally at 216 dpi. System font fallback keeps multilingual names intact
// without sending customer text to a conversion service or font provider.
export async function createReceiptPdf(receipt) {
  const [{ PDFDocument }, logo] = await Promise.all([
    import('./vendor/pdf-lib-1.17.1.js'),
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The receipt logo could not load. Please try again.'));
      image.src = new URL('./images/carve.svg', import.meta.url).href;
    }),
    document.fonts.load('12px Muli'), document.fonts.load('20px Diagramm')
  ]);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt - ${receipt.outlet.name} - ${receipt.date}`);
  pdf.setAuthor(receipt.outlet.company);
  pdf.setCreator('Carve Workspace');
  const width = 595.28, height = 841.89, margin = 44, right = width - margin;
  const scale = 3;
  let canvas, ctx, y, pageIndex = 0;
  const face = 'Muli, Arial, "Noto Sans", sans-serif';

  function font(size = 10, bold = false) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${face}`;
    ctx.fillStyle = '#302b25';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
  }
  function text(value, x, top, size = 10, options = {}) {
    font(size, options.bold);
    ctx.fillStyle = options.color || '#302b25';
    ctx.textAlign = options.align || 'left';
    ctx.fillText(String(value), x, top);
  }
  function rule(top, color = '#ded7ce') {
    ctx.strokeStyle = color; ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(margin, top); ctx.lineTo(right, top); ctx.stroke();
  }
  function lines(value, maxWidth, size = 10, bold = false) {
    font(size, bold);
    const result = [];
    for (const paragraph of String(value).split(/\r?\n/)) {
      let line = '';
      for (const character of Array.from(paragraph)) {
        if (line && ctx.measureText(line + character).width > maxWidth) {
          const space = line.lastIndexOf(' ');
          if (space > line.length / 2) {
            result.push(line.slice(0, space));
            line = line.slice(space + 1) + character;
          } else { result.push(line); line = character; }
        } else line += character;
      }
      result.push(line);
    }
    return result;
  }
  function block(value, x, top, maxWidth, size = 10, leading = 15, options = {}) {
    const wrapped = lines(value, maxWidth, size, options.bold);
    wrapped.forEach((line, i) => text(line, x, top + i * leading, size, options));
    return top + wrapped.length * leading;
  }
  function tableHeader() {
    rule(y);
    y += 12;
    text('ITEM', margin, y, 8, { color: '#897762' });
    text('QTY', 339, y, 8, { align: 'right', color: '#897762' });
    text('PRICE (MYR)', 436, y, 8, { align: 'right', color: '#897762' });
    text('AMOUNT (MYR)', right, y, 8, { align: 'right', color: '#897762' });
    y += 23; rule(y); y += 16;
  }
  function startPage(continued = false) {
    canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PDF rendering is unavailable in this browser. Please use Print instead.');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(logo, margin, 42, 137, 137 / (logo.naturalWidth / logo.naturalHeight));
    text(continued ? 'Receipt - continued' : 'Receipt', right, 42, continued ? 18 : 28, { align: 'right' });
    text(receipt.dateLabel, right, 83, 10, { align: 'right', color: '#77695b' });
    y = block(receipt.outlet.name, margin, 103, 300, 13, 18, { bold: true });
    if (!continued) {
      y = block(receipt.outlet.company, margin, y + 6, 340, 10, 15, { bold: true });
      y = block(`Co. Reg. No. ${receipt.outlet.registration}`, margin, y, 340, 9, 14, { color: '#77695b' });
      y = block(receipt.outlet.address, margin, y + 5, 355, 9, 14, { color: '#77695b' });
      y = block(`${receipt.outlet.phone}  |  ${receipt.outlet.email}`, margin, y + 4, 400, 9, 14, { color: '#77695b' });
      rule(y + 17); y += 36;
      text('RECEIVED FROM', margin, y, 8, { color: '#897762' });
      y = block(receipt.clientName, margin, y + 18, right - margin, 13, 18, { bold: true });
      for (const contact of [receipt.phone, receipt.email].filter(Boolean)) y = block(contact, margin, y + 4, right - margin, 10, 15);
      y += 24;
    } else {
      y = block(receipt.clientName, margin, y + 8, right - margin, 10, 15);
      y += 18;
    }
    tableHeader();
    pageIndex++;
  }
  async function finishPage() {
    rule(height - 49);
    text('CARVE & CARVE LABS', margin, height - 33, 8, { color: '#897762' });
    text(`Page ${pageIndex}`, right, height - 33, 8, { align: 'right', color: '#897762' });
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare the PDF. Please try again.')), 'image/jpeg', .96));
    const image = await pdf.embedJpg(await blob.arrayBuffer());
    pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    canvas.width = 0; canvas.height = 0;
  }
  startPage();
  for (const item of receipt.items) {
    const description = lines(item.description, 255, 10);
    const rowHeight = Math.max(18, description.length * 15) + 21;
    if (y + rowHeight > height - 75) { await finishPage(); startPage(true); }
    description.forEach((line, index) => text(line, margin, y + index * 15, 10));
    text(item.quantity, 339, y, 10, { align: 'right' });
    text(formatMoney(item.unitSen), 436, y, 10, { align: 'right' });
    text(formatMoney(item.amountSen), right, y, 10, { align: 'right' });
    y += rowHeight; rule(y - 10);
  }
  if (y + 153 > height - 75) { await finishPage(); startPage(true); }
  y += 15;
  const labelX = 310;
  for (const [label, amount] of [['Subtotal', receipt.subtotalSen], ['SST (8%)', receipt.taxSen]]) {
    text(label, labelX, y, 10); text(`RM ${formatMoney(amount)}`, right, y, 10, { align: 'right' }); y += 25;
  }
  rule(y + 1, '#a08c74'); y += 17;
  text('Total', labelX, y, 15, { bold: true });
  text(`RM ${formatMoney(receipt.totalSen)}`, right, y, 15, { bold: true, align: 'right' });
  y += 52; text('Thank you for moving with us.', margin, y, 10, { color: '#77695b' });
  await finishPage();
  return pdf.save();
}
