/**
 * PDF bank statement parser.
 * Extracts text-based transaction tables and returns normalized transactions.
 */

const fs = require('fs');
const path = require('path');
const { parseDate } = require('../utils/dateUtils');
const { parseAmount } = require('../utils/formatUtils');

const DATE_TOKEN = String.raw`(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\s]\d{2,4})`;
const AMOUNT_PATTERN = /(?:₹\s*)?(?:\(\s*-?\d[\d,]*(?:\.\d{1,2})?\s*\)|-?\d[\d,]*(?:\.\d{1,2})?)(?:\s*(?:Dr|Cr))?/gi;

function inferBankName(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return baseName.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function collectRows(text) {
  const rows = [];
  const dateAtStart = new RegExp(`^\\s*(${DATE_TOKEN})(?:\\s+|$)(.*)$`, 'i');

  for (const pageText of text.split('\f')) {
    let currentRow = null;

    for (const line of pageText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || /^(?:page\s*)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(trimmed)) continue;

      const match = trimmed.match(dateAtStart);
      if (match && parseDate(match[1])) {
        if (currentRow) rows.push(currentRow);
        currentRow = { date: parseDate(match[1]), text: match[2] || '' };
      } else if (currentRow) {
        currentRow.text += ` ${trimmed}`;
      }
    }

    if (currentRow) rows.push(currentRow);
  }
  return rows;
}

function getDirection(amountText, description, balanceDelta) {
  if (/\bdr\b/i.test(amountText)) return 'debit';
  if (/\bcr\b/i.test(amountText)) return 'credit';

  const amount = parseAmount(amountText);
  if (amount < 0) return 'debit';
  if (balanceDelta != null && balanceDelta !== 0) {
    return balanceDelta < 0 ? 'debit' : 'credit';
  }
  if (/\b(withdraw|debit|paid|payment|purchase|charge|fee|atm|pos|upi)\b/i.test(description)) {
    return 'debit';
  }
  return 'credit';
}

function parsePdfText(text, filePath) {
  const rows = collectRows(text);
  const bankName = inferBankName(filePath);
  const transactions = [];
  let previousBalance = null;

  for (const row of rows) {
    const body = row.text.replace(new RegExp(DATE_TOKEN, 'gi'), ' ');
    const amounts = [...body.matchAll(AMOUNT_PATTERN)].filter((match) => {
      const value = match[0].replace(/\b(?:dr|cr)\b/i, '').replace(/[₹,\s]/g, '');
      return !/^-?\d{9,}$/.test(value);
    });
    if (amounts.length === 0) continue;

    const trailingAmounts = amounts.slice(-3);
    const firstAmount = trailingAmounts[0];
    const description = body.slice(0, firstAmount.index)
      .replace(/[|•]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let debit = 0;
    let credit = 0;
    let balance = 0;
    let amountText;

    if (trailingAmounts.length >= 3) {
      debit = Math.abs(parseAmount(trailingAmounts[0][0]));
      credit = Math.abs(parseAmount(trailingAmounts[1][0]));
      balance = parseAmount(trailingAmounts[2][0]);
    } else if (trailingAmounts.length === 2) {
      amountText = trailingAmounts[0][0];
      const amount = parseAmount(amountText);
      balance = parseAmount(trailingAmounts[1][0]);
      const delta = previousBalance == null ? null : balance - previousBalance;
      if (getDirection(amountText, description, delta) === 'debit') debit = Math.abs(amount);
      else credit = Math.abs(amount);
    } else {
      amountText = trailingAmounts[0][0];
      const amount = parseAmount(amountText);
      if (getDirection(amountText, description, null) === 'debit') debit = Math.abs(amount);
      else credit = Math.abs(amount);
    }

    if (!description && debit === 0 && credit === 0) continue;

    transactions.push({
      date: row.date,
      description,
      chequeNo: '',
      bankName,
      sheetName: '',
      debit,
      credit,
      balance,
      source: path.basename(filePath),
      type: debit > 0 ? 'debit' : 'credit'
    });

    if (trailingAmounts.length >= 2) previousBalance = balance;
  }

  return transactions;
}

async function parsePDF(filePath) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(filePath)),
    useSystemFonts: true
  }).promise;

  let text = '';
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let previousY = null;
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        const y = item.transform?.[5];
        if (Number.isFinite(y) && previousY != null && Math.abs(y - previousY) > 1 && !text.endsWith('\n')) {
          text += '\f\n';
        }
        text += item.str;
        text += item.hasEOL ? '\n' : ' ';
        if (Number.isFinite(y)) previousY = y;
      }
      text += '\n';
    }
  } finally {
    await document.destroy();
  }

  if (!text.trim()) {
    throw new Error('No selectable text found in this PDF. Scanned/image-only statements are not supported.');
  }
  return parsePdfText(text, filePath);
}

module.exports = { parsePDF, parsePdfText };
