/**
 * Bank Statement Analyzer — CLI Entry Point
 *
 * Usage:
 *   node src/index.js --input ./data/input --output ./output
 *   node src/index.js -i ./data/input -o ./output --format excel
 *   node src/index.js -i ./data/input -o ./output --format both
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');

const { parseCSV } = require('./parser/csvParser');
const { parseExcel } = require('./parser/excelParser');
const { parsePDF } = require('./parser/pdfParser');
const { categorizeAll } = require('./analyzer/categorizer');
const { buildSummary } = require('./analyzer/summaryEngine');
const { generateExcelReport } = require('./reporter/excelReporter');
const { generateCSVReports } = require('./reporter/csvReporter');
const { formatCurrency, formatPercentage } = require('./utils/formatUtils');

// ─── CLI Setup ───
program
  .name('bank-analyzer')
  .description('Analyze bank statements across all Financial Years')
  .version('1.0.0')
  .requiredOption('-i, --input <dir>', 'Input directory containing bank statements', './data/input')
  .option('-o, --output <dir>', 'Output directory for reports', './output')
  .option('-f, --format <type>', 'Output format: excel, csv, or both', 'both')
  .parse(process.argv);

const options = program.opts();

// ─── Main Pipeline ───
async function main() {
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║   📊 Bank Statement Analyzer — All FY Edition    ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════╝\n'));

  const inputDir = path.resolve(options.input);
  const outputDir = path.resolve(options.output);

  // Validate input directory
  if (!fs.existsSync(inputDir)) {
    console.error(chalk.red(`✗ Input directory not found: ${inputDir}`));
    console.log(chalk.yellow(`  Create the directory and place your bank statement CSV, Excel, or PDF files there.`));
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ─── Step 1: Discover Files ───
  console.log(chalk.cyan('▸ Step 1: Discovering bank statement files...'));

  const files = fs.readdirSync(inputDir)
    .filter(f => /\.(csv|xlsx|xls|pdf)$/i.test(f))
    .map(f => path.join(inputDir, f));

  if (files.length === 0) {
    console.error(chalk.red(`✗ No CSV, Excel, or PDF files found in: ${inputDir}`));
    console.log(chalk.yellow(`  Supported formats: .csv, .xlsx, .xls, .pdf`));
    process.exit(1);
  }

  console.log(chalk.white(`  Found ${files.length} file(s):`));
  files.forEach(f => console.log(chalk.gray(`    • ${path.basename(f)}`)));

  // ─── Step 2: Parse Files ───
  console.log(chalk.cyan('\n▸ Step 2: Parsing bank statements...'));

  let allTransactions = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    try {
      let transactions;
      if (ext === '.csv') {
        transactions = await parseCSV(file);
      } else if (ext === '.pdf') {
        transactions = await parsePDF(file);
      } else {
        transactions = await parseExcel(file);
      }
      console.log(chalk.white(`  ✓ ${path.basename(file)}: ${transactions.length} transactions`));
      allTransactions = allTransactions.concat(transactions);
    } catch (err) {
      console.error(chalk.red(`  ✗ Error parsing ${path.basename(file)}: ${err.message}`));
    }
  }

  if (allTransactions.length === 0) {
    console.error(chalk.red('\n✗ No transactions found. Check your file formats.'));
    process.exit(1);
  }

  // Sort by date
  allTransactions.sort((a, b) => a.date - b.date);

  console.log(chalk.green(`  Total: ${allTransactions.length} transactions loaded`));

  // ─── Step 3: Categorize ───
  console.log(chalk.cyan('\n▸ Step 3: Categorizing transactions...'));
  categorizeAll(allTransactions);

  const categories = new Set(allTransactions.map(t => t.category));
  console.log(chalk.white(`  Identified ${categories.size} categories`));

  // ─── Step 4: Analyze ───
  console.log(chalk.cyan('\n▸ Step 4: Analyzing Financial Years...'));
  const summary = buildSummary(allTransactions);

  console.log(chalk.white(`  Financial Years: ${summary.fyLabels.join(', ')}`));

  // ─── Step 5: Print Console Summary ───
  printConsoleSummary(summary);

  // ─── Step 6: Generate Reports ───
  console.log(chalk.cyan('\n▸ Step 6: Generating reports...'));

  const format = options.format.toLowerCase();

  if (format === 'excel' || format === 'both') {
    const excelPath = await generateExcelReport(summary, outputDir);
    console.log(chalk.green(`  ✓ Excel report: ${excelPath}`));
  }

  if (format === 'csv' || format === 'both') {
    const csvPaths = await generateCSVReports(summary, outputDir);
    csvPaths.forEach(p => console.log(chalk.green(`  ✓ CSV: ${p}`)));
  }

  console.log(chalk.green.bold('\n✔ Analysis complete! Reports saved to: ' + outputDir));
  console.log();
}

// ─── Console Summary ───
function printConsoleSummary(summary) {
  const s = summary.overallStats;

  console.log(chalk.yellow.bold('\n━━━ OVERALL SUMMARY ━━━'));

  const overviewTable = new Table({
    style: { head: ['cyan'] }
  });
  overviewTable.push(
    { 'Total Transactions': s.totalTransactions.toLocaleString('en-IN') },
    { 'Total Credits': formatCurrency(s.totalCredit) },
    { 'Total Debits': formatCurrency(s.totalDebit) },
    { 'Net Cash Flow': formatCurrency(s.netFlow) },
    { 'Savings Rate': formatPercentage(s.totalCredit ? (s.netFlow / s.totalCredit) * 100 : 0) }
  );
  console.log(overviewTable.toString());

  // FY Comparison
  console.log(chalk.yellow.bold('\n━━━ FY COMPARISON ━━━'));

  const fyTable = new Table({
    head: ['FY', 'Credit', 'Debit', 'Net Flow', 'Txns', 'Savings %'],
    style: { head: ['cyan'] }
  });

  summary.fyComparison.forEach(r => {
    fyTable.push([
      r.fy,
      formatCurrency(r.totalCredit),
      formatCurrency(r.totalDebit),
      formatCurrency(r.netFlow),
      r.transactions,
      formatPercentage(r.savingsRate)
    ]);
  });
  console.log(fyTable.toString());

  // Top Categories
  console.log(chalk.yellow.bold('\n━━━ TOP SPENDING CATEGORIES ━━━'));

  const catTable = new Table({
    head: ['Category', 'Total Spent', '% of Total', 'Txns'],
    style: { head: ['cyan'] }
  });

  summary.topSpendingCategories.slice(0, 8).forEach(c => {
    catTable.push([
      c.category,
      formatCurrency(c.totalSpent),
      formatPercentage(c.percentOfTotal),
      c.count
    ]);
  });
  console.log(catTable.toString());
}

main().catch(err => {
  console.error(chalk.red(`\nFatal error: ${err.message}`));
  console.error(err.stack);
  process.exit(1);
});
