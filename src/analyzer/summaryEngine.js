/**
 * Summary Engine.
 * Builds the master summary combining all FY analyses.
 */

const { analyzeAllFYs, computeStats, categoryBreakdown } = require('./fyAnalyzer');
const { percentage } = require('../utils/formatUtils');
const { sortFYLabels } = require('../utils/dateUtils');

/**
 * Build complete summary report data.
 * @param {Array} transactions - All categorized transactions
 * @returns {Object} Complete summary object
 */
function buildSummary(transactions) {
  const { fyLabels, analysis } = analyzeAllFYs(transactions);

  // ─── Overall Stats ───
  const overallStats = computeStats(transactions);
  const overallCategories = categoryBreakdown(transactions);

  // ─── FY Comparison Table ───
  const fyComparison = fyLabels.map(fy => {
    const s = analysis[fy].stats;
    return {
      fy,
      totalCredit: s.totalCredit,
      totalDebit: s.totalDebit,
      netFlow: s.netFlow,
      transactions: s.totalTransactions,
      savingsRate: percentage(s.netFlow, s.totalCredit)
    };
  });

  // ─── Year-over-Year Growth ───
  const yoyGrowth = [];
  for (let i = 1; i < fyLabels.length; i++) {
    const prev = analysis[fyLabels[i - 1]].stats;
    const curr = analysis[fyLabels[i]].stats;

    yoyGrowth.push({
      from: fyLabels[i - 1],
      to: fyLabels[i],
      incomeGrowth: prev.totalCredit ? percentage(curr.totalCredit - prev.totalCredit, prev.totalCredit) : 0,
      expenseGrowth: prev.totalDebit ? percentage(curr.totalDebit - prev.totalDebit, prev.totalDebit) : 0,
      netFlowChange: curr.netFlow - prev.netFlow
    });
  }

  // ─── Top Spending Categories (across all FYs) ───
  const topSpendingCategories = Object.entries(overallCategories)
    .filter(([, v]) => v.debit > 0)
    .sort((a, b) => b[1].debit - a[1].debit)
    .slice(0, 10)
    .map(([cat, data]) => ({
      category: cat,
      totalSpent: data.debit,
      percentOfTotal: percentage(data.debit, overallStats.totalDebit),
      avgPerTransaction: data.count ? Math.round((data.debit / data.count) * 100) / 100 : 0,
      count: data.count
    }));

  // ─── Monthly Trend (flattened across all FYs) ───
  const monthlyTrend = [];
  for (const fy of fyLabels) {
    for (const [month, stats] of Object.entries(analysis[fy].monthlyStats)) {
      monthlyTrend.push({
        fy,
        month,
        ...stats
      });
    }
  }

  return {
    overallStats,
    overallCategories,
    fyLabels,
    fyAnalysis: analysis,
    fyComparison,
    yoyGrowth,
    topSpendingCategories,
    monthlyTrend
  };
}

module.exports = { buildSummary };
