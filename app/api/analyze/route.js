import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { UPLOAD_DIR, OUTPUT_DIR, ALLOWED_EXTENSIONS } from '@/lib/paths';
import { parseCSV } from '@/src/parser/csvParser';
import { parseExcel } from '@/src/parser/excelParser';
import { categorizeAll } from '@/src/analyzer/categorizer';
import { buildSummary } from '@/src/analyzer/summaryEngine';
import { generateExcelReport } from '@/src/reporter/excelReporter';
import { generateCSVReports } from '@/src/reporter/csvReporter';

export async function POST() {
  try {

    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: 'No bank statement files found. Upload files first.' },
        { status: 400 }
      );
    }

    const files = readdirSync(UPLOAD_DIR)
      .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(UPLOAD_DIR, f));

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No bank statement files found. Upload files first.' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'No transactions could be parsed from the uploaded files.', parseResults },
        { status: 400 }
      );
    }

    allTransactions.sort((a, b) => a.date - b.date);
    categorizeAll(allTransactions);
    const summary = buildSummary(allTransactions);

    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
    const excelPath = await generateExcelReport(summary, OUTPUT_DIR);
    const csvPaths = await generateCSVReports(summary, OUTPUT_DIR);

    const serializedTransactions = allTransactions.map((t, idx) => ({
      id: idx + 1,
      date: t.date instanceof Date ? t.date.toISOString().slice(0, 10) : t.date,
      description: t.description || '',
      debit: t.debit || 0,
      credit: t.credit || 0,
      balance: t.balance || 0,
      category: t.category || 'Uncategorized',
      type: t.type || (t.debit > 0 ? 'debit' : 'credit'),
      source: t.source || ''
    }));

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

    for (const fy of summary.fyLabels) {
      const a = summary.fyAnalysis[fy];
      response.fyDetail[fy] = {
        stats: a.stats,
        categoryBreakdown: a.categoryBreakdown,
        quarterlyStats: a.quarterlyStats
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed: ' + err.message }, { status: 500 });
  }
}
