/**
 * Excel Bank Statement Parser.
 * Reads .xlsx/.xls files and returns normalized transaction objects.
 */

const path = require('path');
const ExcelJS = require('exceljs');
const { parseDate } = require('../utils/dateUtils');
const { parseAmount } = require('../utils/formatUtils');

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function inferBankName(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return baseName.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Same column mapping strategy as CSV parser
const COLUMN_MAPS = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
  description: ['description', 'narration', 'particulars', 'remarks', 'details', 'transaction details'],
  debit: ['debit', 'withdrawal', 'debit amount', 'withdrawal amt', 'dr'],
  credit: ['credit', 'deposit', 'credit amount', 'deposit amt', 'cr'],
  balance: ['balance', 'closing balance', 'running balance', 'available balance'],
  amount: ['amount', 'transaction amount', 'txn amount'],
  chequeNo: ['cheque no', 'cheque number', 'cheque no.', 'chq no', 'chq no.', 'chq. no.', 'check no', 'check number', 'instrument no', 'instrument number']
};

function findColumnIndex(headerRow, candidates) {
  const normalizedCandidates = candidates.map(c => normalizeHeader(c));
  for (let i = 0; i < headerRow.length; i++) {
    const cell = normalizeHeader(headerRow[i]);
    for (const candidate of normalizedCandidates) {
      if (cell === candidate || cell.includes(candidate)) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Parse a single Excel file.
 * @param {string} filePath
 * @returns {Promise<Array>}
 */
async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const transactions = [];
  const bankName = inferBankName(filePath);

  workbook.eachSheet((worksheet) => {
    let headerRowIndex = -1;
    let columnMap = {};
    const rows = [];

    // Collect all rows (Array.from converts sparse arrays to dense)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      rows.push({ values: Array.from(row.values.slice(1)), rowNumber });
    });

    // Find header row (first row that contains a date-like column name)
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const cells = rows[i].values.map(v => String(v == null ? '' : v).toLowerCase().trim());
      const dateIdx = cells.findIndex(c =>
        c && COLUMN_MAPS.date.some(d => c.includes(d))
      );
      if (dateIdx !== -1) {
        headerRowIndex = i;
        const headerCells = rows[i].values.map(v => String(v == null ? '' : v).toLowerCase().trim());
        columnMap = {
          date: findColumnIndex(headerCells, COLUMN_MAPS.date),
          description: findColumnIndex(headerCells, COLUMN_MAPS.description),
          debit: findColumnIndex(headerCells, COLUMN_MAPS.debit),
          credit: findColumnIndex(headerCells, COLUMN_MAPS.credit),
          balance: findColumnIndex(headerCells, COLUMN_MAPS.balance),
          amount: findColumnIndex(headerCells, COLUMN_MAPS.amount),
          chequeNo: findColumnIndex(headerCells, COLUMN_MAPS.chequeNo)
        };
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.warn(`⚠  No header row found in sheet "${worksheet.name}" of ${path.basename(filePath)}`);
      return;
    }

    // Parse data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const cells = rows[i].values;

      const rawDate = cells[columnMap.date];
      const date = rawDate instanceof Date ? rawDate : parseDate(rawDate);
      if (!date) continue;

      const description = String(cells[columnMap.description] || '').trim();
      let debit = columnMap.debit !== -1 ? parseAmount(cells[columnMap.debit]) : 0;
      let credit = columnMap.credit !== -1 ? parseAmount(cells[columnMap.credit]) : 0;

      if (columnMap.debit === -1 && columnMap.credit === -1 && columnMap.amount !== -1) {
        const amt = parseAmount(cells[columnMap.amount]);
        if (amt < 0) {
          debit = Math.abs(amt);
        } else {
          credit = amt;
        }
      }

      const balance = columnMap.balance !== -1 ? parseAmount(cells[columnMap.balance]) : 0;
      const chequeNo = columnMap.chequeNo !== -1 ? String(cells[columnMap.chequeNo] || '').trim() : '';

      transactions.push({
        date,
        description,
        chequeNo,
        bankName,
        sheetName: worksheet.name,
        debit: debit || 0,
        credit: credit || 0,
        balance: balance || 0,
        source: path.basename(filePath),
        type: debit > 0 ? 'debit' : 'credit'
      });
    }
  });

  return transactions;
}

module.exports = { parseExcel };
