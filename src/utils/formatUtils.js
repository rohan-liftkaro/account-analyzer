/**
 * Formatting utility functions.
 */

/**
 * Format number as Indian currency (₹).
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a number with commas (Indian notation).
 */
function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN');
}

/**
 * Parse a currency/amount string to a number.
 * Handles: "1,23,456.78", "₹1,23,456", "-1234.56", "(1234.56)"
 */
function parseAmount(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;

  let str = String(value).trim();

  // Handle parentheses as negative: (1234) → -1234
  const isNegative = str.startsWith('(') && str.endsWith(')');
  if (isNegative) {
    str = str.slice(1, -1);
  }

  // Check for Dr (debit) indicator
  const isDr = /\bDr\b/i.test(str);

  // Remove currency symbols, commas, Cr/Dr suffixes, and whitespace
  str = str.replace(/\b(Cr|Dr)\b/gi, '').replace(/[₹$,\s]/g, '');

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  return (isNegative || isDr) ? -num : num;
}

/**
 * Calculate percentage.
 */
function percentage(part, total) {
  if (!total) return 0;
  return ((part / total) * 100);
}

/**
 * Format percentage with % sign.
 */
function formatPercentage(value) {
  return `${Number(value).toFixed(1)}%`;
}

module.exports = {
  formatCurrency,
  formatNumber,
  parseAmount,
  percentage,
  formatPercentage
};
