/**
 * Excel Report Generator.
 * Creates a multi-sheet Excel workbook with all analysis results.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const { formatCurrency, formatPercentage } = require('../utils/formatUtils');

// Color palette
const COLORS = {
  headerBg: 'FF1B5E20',      // Dark green
  headerFont: 'FFFFFFFF',     // White
  creditBg: 'FFE8F5E9',       // Light green
  debitBg: 'FFFFEBEE',        // Light red
  totalBg: 'FFF3E5F5',        // Light purple
  borderColor: 'FFB0BEC5'     // Grey
};

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.font = { color: { argb: COLORS.headerFont }, bold: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderColor } },
      bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
      left: { style: 'thin', color: { argb: COLORS.borderColor } },
      right: { style: 'thin', color: { argb: COLORS.borderColor } }
    };
  });
  row.height = 25;
}

function styleDataRow(row, isAlt) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderColor } },
      bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
      left: { style: 'thin', color: { argb: COLORS.borderColor } },
      right: { style: 'thin', color: { argb: COLORS.borderColor } }
    };
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    }
  });
}

/**
 * Generate the full Excel report.
 * @param {Object} summary - Output from buildSummary()
 * @param {string} outputDir - Output directory path
 * @returns {Promise<string>} Path to generated file
 */
async function generateExcelReport(summary, outputDir) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bank Statement Analyzer';
  workbook.created = new Date();

  // ─── Sheet 1: Dashboard / Overview ───
  const dashSheet = workbook.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FF1B5E20' } } });
  addDashboard(dashSheet, summary);

  // ─── Sheet 2: FY Comparison ───
  const compSheet = workbook.addWorksheet('FY Comparison', { properties: { tabColor: { argb: 'FF1565C0' } } });
  addFYComparison(compSheet, summary);

  // ─── Sheet 3: Category Analysis ───
  const catSheet = workbook.addWorksheet('Category Analysis', { properties: { tabColor: { argb: 'FFE65100' } } });
  addCategoryAnalysis(catSheet, summary);

  // ─── Sheet 4: Monthly Trends ───
  const monthSheet = workbook.addWorksheet('Monthly Trends', { properties: { tabColor: { argb: 'FF6A1B9A' } } });
  addMonthlyTrends(monthSheet, summary);

  // ─── Sheet 5: YoY Growth ───
  const yoySheet = workbook.addWorksheet('YoY Growth', { properties: { tabColor: { argb: 'FF00695C' } } });
  addYoYGrowth(yoySheet, summary);

  // ─── Sheet 6: Per-FY Category Breakdown ───
  for (const fy of summary.fyLabels) {
    const sheetName = fy.replace(/\s+/g, '');
    const fySheet = workbook.addWorksheet(sheetName, { properties: { tabColor: { argb: 'FF37474F' } } });
    addFYDetailSheet(fySheet, fy, summary.fyAnalysis[fy]);
  }

  const fileName = `Bank_Statement_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const filePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

// ─── Dashboard Sheet ───
function addDashboard(sheet, summary) {
  const s = summary.overallStats;

  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 }
  ];

  // Title
  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📊 BANK STATEMENT ANALYSIS — ALL FY SUMMARY';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1B5E20' } };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:B2');
  sheet.getCell('A2').value = `Analysis Period: ${summary.fyLabels[0]} to ${summary.fyLabels[summary.fyLabels.length - 1]}`;
  sheet.getCell('A2').font = { italic: true, size: 11 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  const data = [
    ['Total Transactions', s.totalTransactions.toLocaleString('en-IN')],
    ['Total Credits (Income)', formatCurrency(s.totalCredit)],
    ['Total Debits (Expenses)', formatCurrency(s.totalDebit)],
    ['Net Cash Flow', formatCurrency(s.netFlow)],
    ['Savings Rate', formatPercentage((s.netFlow / s.totalCredit) * 100 || 0)],
    ['Avg Credit per Txn', formatCurrency(s.avgCredit)],
    ['Avg Debit per Txn', formatCurrency(s.avgDebit)],
    ['Largest Credit', `${formatCurrency(s.maxCredit)} — ${s.maxCreditDescription}`],
    ['Largest Debit', `${formatCurrency(s.maxDebit)} — ${s.maxDebitDescription}`],
    ['Financial Years Covered', summary.fyLabels.length.toString()],
  ];

  let rowNum = 4;
  const headerRow = sheet.getRow(rowNum);
  headerRow.values = ['Metric', 'Value'];
  styleHeader(headerRow);
  rowNum++;

  data.forEach((item, i) => {
    const row = sheet.getRow(rowNum);
    row.values = item;
    styleDataRow(row, i % 2 === 0);
    rowNum++;
  });

  // Top spending categories section
  rowNum += 2;
  sheet.mergeCells(`A${rowNum}:B${rowNum}`);
  sheet.getCell(`A${rowNum}`).value = '🏷️ TOP SPENDING CATEGORIES';
  sheet.getCell(`A${rowNum}`).font = { bold: true, size: 14, color: { argb: 'FFE65100' } };
  rowNum++;

  const catHeaderRow = sheet.getRow(rowNum);
  catHeaderRow.values = ['Category', 'Total Spent'];
  styleHeader(catHeaderRow);
  rowNum++;

  summary.topSpendingCategories.forEach((cat, i) => {
    const row = sheet.getRow(rowNum);
    row.values = [cat.category, `${formatCurrency(cat.totalSpent)} (${formatPercentage(cat.percentOfTotal)})`];
    styleDataRow(row, i % 2 === 0);
    rowNum++;
  });
}

// ─── FY Comparison Sheet ───
function addFYComparison(sheet, summary) {
  sheet.columns = [
    { header: 'Financial Year', key: 'fy', width: 18 },
    { header: 'Total Credit', key: 'credit', width: 20 },
    { header: 'Total Debit', key: 'debit', width: 20 },
    { header: 'Net Flow', key: 'net', width: 20 },
    { header: 'Transactions', key: 'txns', width: 15 },
    { header: 'Savings Rate', key: 'savings', width: 15 }
  ];

  const headerRow = sheet.getRow(1);
  styleHeader(headerRow);

  summary.fyComparison.forEach((row, i) => {
    const dataRow = sheet.addRow({
      fy: row.fy,
      credit: formatCurrency(row.totalCredit),
      debit: formatCurrency(row.totalDebit),
      net: formatCurrency(row.netFlow),
      txns: row.transactions,
      savings: formatPercentage(row.savingsRate)
    });
    styleDataRow(dataRow, i % 2 === 0);
  });
}

// ─── Category Analysis Sheet ───
function addCategoryAnalysis(sheet, summary) {
  sheet.columns = [
    { header: 'Category', key: 'cat', width: 28 },
    { header: 'Total Debit', key: 'debit', width: 20 },
    { header: 'Total Credit', key: 'credit', width: 20 },
    { header: 'Txn Count', key: 'count', width: 12 },
    { header: '% of Total Spend', key: 'percent', width: 18 }
  ];

  const headerRow = sheet.getRow(1);
  styleHeader(headerRow);

  const totalDebit = summary.overallStats.totalDebit;

  Object.entries(summary.overallCategories).forEach(([cat, data], i) => {
    const pct = totalDebit ? (data.debit / totalDebit) * 100 : 0;
    const dataRow = sheet.addRow({
      cat,
      debit: formatCurrency(data.debit),
      credit: formatCurrency(data.credit),
      count: data.count,
      percent: formatPercentage(pct)
    });
    styleDataRow(dataRow, i % 2 === 0);
  });
}

// ─── Monthly Trends Sheet ───
function addMonthlyTrends(sheet, summary) {
  sheet.columns = [
    { header: 'FY', key: 'fy', width: 14 },
    { header: 'Month', key: 'month', width: 14 },
    { header: 'Credit', key: 'credit', width: 18 },
    { header: 'Debit', key: 'debit', width: 18 },
    { header: 'Net Flow', key: 'net', width: 18 },
    { header: 'Transactions', key: 'txns', width: 14 }
  ];

  const headerRow = sheet.getRow(1);
  styleHeader(headerRow);

  summary.monthlyTrend.forEach((row, i) => {
    const dataRow = sheet.addRow({
      fy: row.fy,
      month: row.month,
      credit: formatCurrency(row.totalCredit),
      debit: formatCurrency(row.totalDebit),
      net: formatCurrency(row.netFlow),
      txns: row.totalTransactions
    });
    styleDataRow(dataRow, i % 2 === 0);
  });
}

// ─── YoY Growth Sheet ───
function addYoYGrowth(sheet, summary) {
  sheet.columns = [
    { header: 'Period', key: 'period', width: 25 },
    { header: 'Income Growth %', key: 'income', width: 18 },
    { header: 'Expense Growth %', key: 'expense', width: 18 },
    { header: 'Net Flow Change', key: 'netChange', width: 20 }
  ];

  const headerRow = sheet.getRow(1);
  styleHeader(headerRow);

  summary.yoyGrowth.forEach((row, i) => {
    const dataRow = sheet.addRow({
      period: `${row.from} → ${row.to}`,
      income: formatPercentage(row.incomeGrowth),
      expense: formatPercentage(row.expenseGrowth),
      netChange: formatCurrency(row.netFlowChange)
    });
    styleDataRow(dataRow, i % 2 === 0);
  });
}

// ─── Per-FY Detail Sheet ───
function addFYDetailSheet(sheet, fyLabel, fyData) {
  // Title
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = `${fyLabel} — Category Breakdown`;
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Stats summary
  const s = fyData.stats;
  sheet.getCell('A3').value = 'Total Credit:';
  sheet.getCell('B3').value = formatCurrency(s.totalCredit);
  sheet.getCell('C3').value = 'Total Debit:';
  sheet.getCell('D3').value = formatCurrency(s.totalDebit);
  sheet.getCell('A4').value = 'Net Flow:';
  sheet.getCell('B4').value = formatCurrency(s.netFlow);
  sheet.getCell('C4').value = 'Transactions:';
  sheet.getCell('D4').value = s.totalTransactions;

  [sheet.getCell('A3'), sheet.getCell('C3'), sheet.getCell('A4'), sheet.getCell('C4')].forEach(c => {
    c.font = { bold: true };
  });

  // Category table
  const headerRowNum = 6;
  sheet.getRow(headerRowNum).values = ['Category', 'Debit', 'Credit', 'Count', '% of FY Spend'];
  styleHeader(sheet.getRow(headerRowNum));

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 16;

  let rowNum = headerRowNum + 1;
  Object.entries(fyData.categoryBreakdown).forEach(([cat, data], i) => {
    const pct = s.totalDebit ? (data.debit / s.totalDebit) * 100 : 0;
    const row = sheet.getRow(rowNum);
    row.values = [cat, formatCurrency(data.debit), formatCurrency(data.credit), data.count, formatPercentage(pct)];
    styleDataRow(row, i % 2 === 0);
    rowNum++;
  });
}

module.exports = { generateExcelReport };
