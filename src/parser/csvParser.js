/**
 * CSV Bank Statement Parser.
 * Reads CSV files and returns normalized transaction objects.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parseDate } = require('../utils/dateUtils');
const { parseAmount } = require('../utils/formatUtils');

// Common column name mappings (banks use different headers)
const COLUMN_MAPS = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'txn_date', 'trans date'],
  description: ['description', 'narration', 'particulars', 'remarks', 'details', 'transaction details',
    'txn description', 'transaction remarks', 'narrative'],
  debit: ['debit', 'withdrawal', 'debit amount', 'withdrawal amt', 'dr', 'debit(inr)', 'withdrawals'],
  credit: ['credit', 'deposit', 'credit amount', 'deposit amt', 'cr', 'credit(inr)', 'deposits'],
  balance: ['balance', 'closing balance', 'running balance', 'available balance', 'bal'],
  amount: ['amount', 'transaction amount', 'txn amount']
};

/**
 * Find the best matching column name from the headers.
 */
function findColumn(headers, candidates) {
  const normalized = headers.map(h => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  // Partial match
  for (const candidate of candidates) {
    const idx = normalized.findIndex(h => h.includes(candidate));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/**
 * Parse a single CSV file.
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Promise<Array>} Array of normalized transaction objects
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const transactions = [];
    let headers = [];
    let columnMap = {};
    let headersMapped = false;

    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim(),
        skipLines: 0
      }));

    stream.on('headers', (hdrs) => {
      headers = hdrs;
      columnMap = {
        date: findColumn(headers, COLUMN_MAPS.date),
        description: findColumn(headers, COLUMN_MAPS.description),
        debit: findColumn(headers, COLUMN_MAPS.debit),
        credit: findColumn(headers, COLUMN_MAPS.credit),
        balance: findColumn(headers, COLUMN_MAPS.balance),
        amount: findColumn(headers, COLUMN_MAPS.amount)
      };
      headersMapped = true;

      if (!columnMap.date) {
        console.warn(`⚠  No date column found in ${path.basename(filePath)}. Headers: ${headers.join(', ')}`);
      }
    });

    stream.on('data', (row) => {
      if (!headersMapped) return;

      const dateVal = row[columnMap.date];
      const date = parseDate(dateVal);
      if (!date) return; // Skip rows without valid dates

      const description = (row[columnMap.description] || '').trim();
      let debit = parseAmount(row[columnMap.debit]);
      let credit = parseAmount(row[columnMap.credit]);

      // If only "amount" column exists, determine debit/credit by sign
      if (!columnMap.debit && !columnMap.credit && columnMap.amount) {
        const amt = parseAmount(row[columnMap.amount]);
        if (amt < 0) {
          debit = Math.abs(amt);
        } else {
          credit = amt;
        }
      }

      const balance = parseAmount(row[columnMap.balance]);

      transactions.push({
        date,
        description,
        debit: debit || 0,
        credit: credit || 0,
        balance: balance || 0,
        source: path.basename(filePath),
        type: debit > 0 ? 'debit' : 'credit'
      });
    });

    stream.on('end', () => resolve(transactions));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = { parseCSV };
