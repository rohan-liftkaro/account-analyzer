/**
 * API Routes for Bank Statement Analyzer.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { parseCSV } = require('../../parser/csvParser');
const { parseExcel } = require('../../parser/excelParser');
const { categorizeAll } = require('../../analyzer/categorizer');
const { buildSummary } = require('../../analyzer/summaryEngine');
const { generateExcelReport } = require('../../reporter/excelReporter');
const { generateCSVReports } = require('../../reporter/csvReporter');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'data', 'input');
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'output');

// Ensure directories exist
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config — only allow csv/excel files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Sanitize filename — keep original name but remove path traversal chars
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._\-()[\] ]/g, '_');
    cb(null, safeName);
  }
});

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'));
    }
  }
});

// ─── Upload Files ───
router.post('/upload', upload.array('statements', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploaded = req.files.map(f => ({
    name: f.originalname,
    savedAs: f.filename,
    size: f.size
  }));

  res.json({ success: true, files: uploaded });
});

// ─── List Uploaded Files ───
router.get('/files', (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return res.json({ files: [] });
  }

  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, f));
      return {
        name: f,
        size: stats.size,
        modified: stats.mtime
      };
    });

  res.json({ files });
});

// ─── Delete a file ───
router.delete('/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// ─── Run Analysis ───
router.post('/analyze', async (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(UPLOAD_DIR, f));

    if (files.length === 0) {
      return res.status(400).json({ error: 'No bank statement files found. Upload files first.' });
    }

    // Parse all files
    let allTransactions = [];
    const parseResults = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      try {
        const transactions = ext === '.csv'
          ? await parseCSV(file)
          : await parseExcel(file);

        parseResults.push({
          file: path.basename(file),
          transactions: transactions.length,
          status: 'ok'
        });
        allTransactions = allTransactions.concat(transactions);
      } catch (err) {
        parseResults.push({
          file: path.basename(file),
          transactions: 0,
          status: 'error',
          error: err.message
        });
      }
    }

    if (allTransactions.length === 0) {
      return res.status(400).json({
        error: 'No transactions could be parsed from the uploaded files.',
        parseResults
      });
    }

    // Sort, categorize, analyze
    allTransactions.sort((a, b) => a.date - b.date);
    categorizeAll(allTransactions);
    const summary = buildSummary(allTransactions);

    // Generate reports
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const excelPath = await generateExcelReport(summary, OUTPUT_DIR);
    const csvPaths = await generateCSVReports(summary, OUTPUT_DIR);

    // Serialize transactions for the table view
    const serializedTransactions = allTransactions.map((t, idx) => ({
      id: idx + 1,
      date: t.date instanceof Date ? t.date.toISOString().slice(0, 10) : t.date,
      description: t.description || '',
      chequeNo: t.chequeNo || '',
      bankName: t.bankName || '',
      sheetName: t.sheetName || '',
      debit: t.debit || 0,
      credit: t.credit || 0,
      balance: t.balance || 0,
      category: t.category || 'Uncategorized',
      type: t.type || (t.debit > 0 ? 'debit' : 'credit'),
      source: t.source || ''
    }));

    // Build response (serialize dates)
    const response = {
      success: true,
      parseResults,
      totalTransactions: allTransactions.length,
      transactions: serializedTransactions,
      overallStats: summary.overallStats,
      fyLabels: summary.fyLabels,
      fyComparison: summary.fyComparison,
      yoyGrowth: summary.yoyGrowth,
      topSpendingCategories: summary.topSpendingCategories,
      categoryBreakdown: summary.overallCategories,
      monthlyTrend: summary.monthlyTrend,
      fyDetail: {},
      downloads: {
        excel: path.basename(excelPath),
        csv: csvPaths.map(p => path.basename(p))
      }
    };

    // Per-FY detail
    for (const fy of summary.fyLabels) {
      const a = summary.fyAnalysis[fy];
      response.fyDetail[fy] = {
        stats: a.stats,
        categoryBreakdown: a.categoryBreakdown,
        quarterlyStats: a.quarterlyStats
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ─── List downloadable reports ───
router.get('/reports', (req, res) => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return res.json({ files: [] });
  }

  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => /\.(xlsx|csv)$/i.test(f))
    .map(f => {
      const stats = fs.statSync(path.join(OUTPUT_DIR, f));
      return { name: f, size: stats.size };
    });

  res.json({ files });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
