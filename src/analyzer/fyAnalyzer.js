/**
 * Financial Year Analyzer.
 * Groups transactions by FY and computes per-FY metrics.
 */

const { getFYLabel, getFYQuarter, getMonthYearLabel, sortFYLabels } = require('../utils/dateUtils');

/**
 * Group transactions by Financial Year.
 * @param {Array} transactions
 * @returns {Object} { "FY 2024-25": [txn, txn, ...], ... }
 */
function groupByFY(transactions) {
  const groups = {};
  for (const txn of transactions) {
    const fy = getFYLabel(txn.date);
    if (!groups[fy]) groups[fy] = [];
    groups[fy].push(txn);
  }
  return groups;
}

/**
 * Group transactions by month within a set.
 * @returns {Object} { "Apr-2024": [txn, ...], ... }
 */
function groupByMonth(transactions) {
  const groups = {};
  for (const txn of transactions) {
    const label = getMonthYearLabel(txn.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(txn);
  }
  return groups;
}

/**
 * Group transactions by quarter within FY context.
 * @returns {Object} { "Q1": [txn, ...], ... }
 */
function groupByQuarter(transactions) {
  const groups = { Q1: [], Q2: [], Q3: [], Q4: [] };
  for (const txn of transactions) {
    const q = getFYQuarter(txn.date);
    groups[q].push(txn);
  }
  return groups;
}

/**
 * Calculate aggregate stats for a set of transactions.
 */
function computeStats(transactions) {
  let totalDebit = 0;
  let totalCredit = 0;
  let maxDebit = 0;
  let maxCredit = 0;
  let maxDebitTxn = null;
  let maxCreditTxn = null;

  for (const txn of transactions) {
    totalDebit += txn.debit;
    totalCredit += txn.credit;

    if (txn.debit > maxDebit) {
      maxDebit = txn.debit;
      maxDebitTxn = txn;
    }
    if (txn.credit > maxCredit) {
      maxCredit = txn.credit;
      maxCreditTxn = txn;
    }
  }

  return {
    totalTransactions: transactions.length,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    netFlow: Math.round((totalCredit - totalDebit) * 100) / 100,
    avgDebit: transactions.length ? Math.round((totalDebit / transactions.length) * 100) / 100 : 0,
    avgCredit: transactions.length ? Math.round((totalCredit / transactions.length) * 100) / 100 : 0,
    maxDebit: Math.round(maxDebit * 100) / 100,
    maxCredit: Math.round(maxCredit * 100) / 100,
    maxDebitDescription: maxDebitTxn ? maxDebitTxn.description : '',
    maxCreditDescription: maxCreditTxn ? maxCreditTxn.description : ''
  };
}

/**
 * Get category-wise breakdown for a set of transactions.
 */
function categoryBreakdown(transactions) {
  const cats = {};
  for (const txn of transactions) {
    const cat = txn.category || 'Others / Uncategorized';
    if (!cats[cat]) {
      cats[cat] = { debit: 0, credit: 0, count: 0 };
    }
    cats[cat].debit += txn.debit;
    cats[cat].credit += txn.credit;
    cats[cat].count++;
  }

  // Sort by total debit descending
  return Object.entries(cats)
    .sort((a, b) => b[1].debit - a[1].debit)
    .reduce((obj, [key, val]) => {
      obj[key] = {
        debit: Math.round(val.debit * 100) / 100,
        credit: Math.round(val.credit * 100) / 100,
        count: val.count
      };
      return obj;
    }, {});
}

/**
 * Analyze all FYs and return comprehensive analysis.
 */
function analyzeAllFYs(transactions) {
  const fyGroups = groupByFY(transactions);
  const fyLabels = sortFYLabels(Object.keys(fyGroups));

  const analysis = {};

  for (const fy of fyLabels) {
    const fyTxns = fyGroups[fy];
    const monthGroups = groupByMonth(fyTxns);
    const quarterGroups = groupByQuarter(fyTxns);

    const monthlyStats = {};
    for (const [month, txns] of Object.entries(monthGroups)) {
      monthlyStats[month] = computeStats(txns);
    }

    const quarterlyStats = {};
    for (const [q, txns] of Object.entries(quarterGroups)) {
      if (txns.length > 0) {
        quarterlyStats[q] = computeStats(txns);
      }
    }

    analysis[fy] = {
      stats: computeStats(fyTxns),
      categoryBreakdown: categoryBreakdown(fyTxns),
      monthlyStats,
      quarterlyStats,
      transactions: fyTxns
    };
  }

  return { fyLabels, analysis };
}

module.exports = {
  groupByFY,
  groupByMonth,
  groupByQuarter,
  computeStats,
  categoryBreakdown,
  analyzeAllFYs
};
