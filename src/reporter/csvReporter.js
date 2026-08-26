/**
 * CSV Report Generator.
 * Exports summary data as CSV files.
 */

const fs = require('fs');
const path = require('path');
const { format } = require('fast-csv');

/**
 * Write an array of objects to a CSV file.
 */
function writeCSV(filePath, rows, headers) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    const csvStream = format({ headers: headers || true });

    csvStream.pipe(ws);
    ws.on('finish', () => resolve(filePath));
    ws.on('error', reject);

    for (const row of rows) {
      csvStream.write(row);
    }
    csvStream.end();
  });
}

/**
 * Generate all CSV report files.
 * @param {Object} summary - Output from buildSummary()
 * @param {string} outputDir
 * @returns {Promise<string[]>} Paths of generated files
 */
async function generateCSVReports(summary, outputDir) {
  const files = [];

  // 1. FY Comparison
  const fyCompRows = summary.fyComparison.map(r => ({
    'Financial Year': r.fy,
    'Total Credit': r.totalCredit.toFixed(2),
    'Total Debit': r.totalDebit.toFixed(2),
    'Net Flow': r.netFlow.toFixed(2),
    'Transactions': r.transactions,
    'Savings Rate %': r.savingsRate.toFixed(1)
  }));
  files.push(await writeCSV(path.join(outputDir, 'fy_comparison.csv'), fyCompRows));

  // 2. Category Summary
  const catRows = Object.entries(summary.overallCategories).map(([cat, data]) => ({
    'Category': cat,
    'Total Debit': data.debit.toFixed(2),
    'Total Credit': data.credit.toFixed(2),
    'Transaction Count': data.count,
    '% of Total Spend': summary.overallStats.totalDebit
      ? ((data.debit / summary.overallStats.totalDebit) * 100).toFixed(1)
      : '0.0'
  }));
  files.push(await writeCSV(path.join(outputDir, 'category_summary.csv'), catRows));

  // 3. Monthly Trends
  const monthRows = summary.monthlyTrend.map(r => ({
    'FY': r.fy,
    'Month': r.month,
    'Total Credit': r.totalCredit.toFixed(2),
    'Total Debit': r.totalDebit.toFixed(2),
    'Net Flow': r.netFlow.toFixed(2),
    'Transactions': r.totalTransactions
  }));
  files.push(await writeCSV(path.join(outputDir, 'monthly_trends.csv'), monthRows));

  // 4. YoY Growth
  const yoyRows = summary.yoyGrowth.map(r => ({
    'Period': `${r.from} to ${r.to}`,
    'Income Growth %': r.incomeGrowth.toFixed(1),
    'Expense Growth %': r.expenseGrowth.toFixed(1),
    'Net Flow Change': r.netFlowChange.toFixed(2)
  }));
  files.push(await writeCSV(path.join(outputDir, 'yoy_growth.csv'), yoyRows));

  // 5. All Transactions (combined)
  const allTxns = [];
  for (const fy of summary.fyLabels) {
    for (const txn of summary.fyAnalysis[fy].transactions) {
      allTxns.push({
        'Date': txn.date.toISOString().slice(0, 10),
        'Description': txn.description,
        'Bank Name': txn.bankName || '',
        'Sheet Name': txn.sheetName || '',
        'Cheque No': txn.chequeNo || '',
        'Debit': txn.debit.toFixed(2),
        'Credit': txn.credit.toFixed(2),
        'Balance': txn.balance.toFixed(2),
        'Category': txn.category,
        'FY': fy,
        'Source File': txn.source
      });
    }
  }
  files.push(await writeCSV(path.join(outputDir, 'all_transactions.csv'), allTxns));

  return files;
}

module.exports = { generateCSVReports };
