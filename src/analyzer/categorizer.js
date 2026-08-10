/**
 * Transaction Categorizer.
 * Automatically categorizes transactions based on description keywords.
 */

const { CATEGORIES, DEFAULT_CATEGORY } = require('../config/categories');

/**
 * Categorize a single transaction based on its description.
 * @param {Object} transaction - { description, type, debit, credit }
 * @returns {string} Category name
 */
function categorize(transaction) {
  const desc = (transaction.description || '').toLowerCase();

  for (const category of CATEGORIES) {
    // If category has a type filter, check it
    if (category.type !== 'both') {
      if (category.type === 'credit' && transaction.debit > 0) continue;
      if (category.type === 'debit' && transaction.credit > 0 && transaction.debit === 0) continue;
    }

    for (const keyword of category.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category.name;
      }
    }
  }

  return DEFAULT_CATEGORY;
}

/**
 * Categorize all transactions in an array.
 * Mutates each transaction by adding a `category` field.
 * @param {Array} transactions
 * @returns {Array} Same array with category field added
 */
function categorizeAll(transactions) {
  for (const txn of transactions) {
    txn.category = categorize(txn);
  }
  return transactions;
}

/**
 * Get a summary of categories and their counts.
 */
function getCategorySummary(transactions) {
  const summary = {};
  for (const txn of transactions) {
    const cat = txn.category || DEFAULT_CATEGORY;
    if (!summary[cat]) {
      summary[cat] = { count: 0, totalDebit: 0, totalCredit: 0 };
    }
    summary[cat].count++;
    summary[cat].totalDebit += txn.debit;
    summary[cat].totalCredit += txn.credit;
  }
  return summary;
}

module.exports = { categorize, categorizeAll, getCategorySummary };
