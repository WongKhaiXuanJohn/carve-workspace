import { formatMoney } from './receipt.js?v=d000e45b03';

export function receiptRowChunk(lines, availableHeight) {
  const count = availableHeight < 39 ? 0 : Math.max(0, Math.floor((availableHeight - 21) / 15));
  const visible = lines.slice(0, count);
  return { lines: visible, rest: lines.slice(count), height: visible.length ? Math.max(18, visible.length * 15) + 21 : 0 };
}

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
    if (options.display) ctx.font = `${size}px Diagramm, Arial, sans-serif`;
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
    ctx.fillStyle = '#f6f3ee'; ctx.fillRect(margin, y, right - margin, 33);
    y += 11;
    text('ITEM', margin, y, 8, { color: '#897762' });
    text('QTY', 339, y, 8, { align: 'right', color: '#897762' });
    text('PRICE (MYR)', 436, y, 8, { align: 'right', color: '#897762' });
    text('AMOUNT (MYR)', right, y, 8, { align: 'right', color: '#897762' });
    y += 22; y += 18;
  }
  function startPage(continued = false) {
    canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PDF rendering is unavailable in this browser. Please use Print instead.');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(logo, margin, 46, 145, 145 / (logo.naturalWidth / logo.naturalHeight));
    text(continued ? 'Receipt - continued' : 'Receipt', right, 43, continued ? 23 : 38, { align: 'right', display: true });
    text('RECEIPT DATE', right, 98, 7.5, { align: 'right', color: '#93816d' });
    text(receipt.dateLabel, right, 114, 10, { align: 'right', color: '#615447' });
    rule(143, '#b9a68e');
    if (!continued) {
      const clientX = 355, businessWidth = 270, clientWidth = right - clientX;
      text('ISSUED BY', margin, 167, 8, { color: '#93816d' });
      let businessY = block(receipt.outlet.name, margin, 187, businessWidth, 13, 18, { bold: true });
      businessY = block(receipt.outlet.company, margin, businessY + 10, businessWidth, 9, 14, { bold: true });
      businessY = block(`Co. Reg. No. ${receipt.outlet.registration}`, margin, businessY + 2, businessWidth, 8, 13, { color: '#77695b' });
      businessY = block(receipt.outlet.address, margin, businessY + 9, businessWidth, 9, 14, { color: '#77695b' });
      businessY = block(`${receipt.outlet.phone}\n${receipt.outlet.email}`, margin, businessY + 9, businessWidth, 9, 14, { color: '#77695b' });
      text('RECEIVED FROM', clientX, 167, 8, { color: '#93816d' });
      let clientY = block(receipt.clientName, clientX, 187, clientWidth, 13, 18, { bold: true });
      for (const contact of [receipt.phone, receipt.email].filter(Boolean)) clientY = block(contact, clientX, clientY + 8, clientWidth, 9, 14, { color: '#77695b' });
      y = Math.max(businessY, clientY) + 34;
    } else {
      y = block(receipt.outlet.name, margin, 166, right - margin, 11, 16, { bold: true });
      y = block(receipt.clientName, margin, y + 8, right - margin, 9, 14, { color: '#77695b' });
      y += 24;
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
    let remaining = lines(item.description, 255, 10), firstChunk = true;
    while (remaining.length) {
      const chunk = receiptRowChunk(remaining, height - 75 - y);
      if (!chunk.lines.length) { await finishPage(); startPage(true); continue; }
      chunk.lines.forEach((line, index) => text(line, margin, y + index * 15, 10));
      if (firstChunk) {
        text(item.quantity, 339, y, 10, { align: 'right' });
        text(formatMoney(item.unitSen), 436, y, 10, { align: 'right' });
        text(formatMoney(item.amountSen), right, y, 10, { align: 'right' });
      }
      y += chunk.height; rule(y - 10);
      remaining = chunk.rest; firstChunk = false;
      if (remaining.length) { await finishPage(); startPage(true); }
    }
  }
  if (y + 190 > height - 75) { await finishPage(); startPage(true); }
  y += 15;
  const labelX = 310;
  for (const [label, amount] of [['Subtotal', receipt.subtotalSen], ['SST (8%)', receipt.taxSen]]) {
    text(label, labelX + 14, y, 10, { color: '#77695b' }); text(`RM ${formatMoney(amount)}`, right - 14, y, 10, { align: 'right' }); y += 26;
  }
  ctx.fillStyle = '#f2ece3'; ctx.fillRect(labelX, y + 4, right - labelX, 52);
  text('Total', labelX + 14, y + 24, 11, { bold: true });
  const totalText = `RM ${formatMoney(receipt.totalSen)}`;
  let totalSize = 21;
  font(totalSize, true);
  while (ctx.measureText(totalText).width > right - labelX - 80 && totalSize > 11) { totalSize -= .5; font(totalSize, true); }
  text(totalText, right - 14, y + 20, totalSize, { bold: true, align: 'right' });
  y += 100; text('Thank you for moving with us.', margin, y, 16, { color: '#615447', display: true });
  await finishPage();
  return pdf.save();
}
