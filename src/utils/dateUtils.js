/**
 * Indian Financial Year utility functions.
 * FY runs from April 1 to March 31.
 * FY 2024-25 = April 1, 2024 — March 31, 2025
 */

/**
 * Get the Financial Year label for a given date.
 * @param {Date} date
 * @returns {string} e.g. "FY 2024-25"
 */
function getFYLabel(date) {
  const month = date.getMonth(); // 0-indexed (0=Jan, 3=Apr)
  const year = date.getFullYear();

  // April (3) onwards → FY starts in this calendar year
  // Jan–Mar → FY started previous calendar year
  const fyStartYear = month >= 3 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;

  return `FY ${fyStartYear}-${String(fyEndYear).slice(2)}`;
}

/**
 * Get the FY quarter (Q1–Q4) for a date.
 * Q1: Apr–Jun, Q2: Jul–Sep, Q3: Oct–Dec, Q4: Jan–Mar
 */
function getFYQuarter(date) {
  const month = date.getMonth();
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
}

/**
 * Get month name from date.
 */
function getMonthName(date) {
  return date.toLocaleString('en-IN', { month: 'short' });
}

/**
 * Get "MMM-YYYY" label for a date.
 */
function getMonthYearLabel(date) {
  return `${getMonthName(date)}-${date.getFullYear()}`;
}

/**
 * Parse a date string into a Date object.
 * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY (ISO)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const str = String(dateStr).trim();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY-MM-DD (ISO)
  const iso = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  // Try Excel serial date number
  if (/^\d{5}$/.test(str)) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + Number(str) * 86400000);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to native parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

/**
 * Get the start and end dates for a given FY label.
 * @param {string} fyLabel e.g. "FY 2024-25"
 * @returns {{ start: Date, end: Date }}
 */
function getFYDateRange(fyLabel) {
  const match = fyLabel.match(/FY\s+(\d{4})/);
  if (!match) return null;

  const startYear = Number(match[1]);
  return {
    start: new Date(startYear, 3, 1),     // April 1
    end: new Date(startYear + 1, 2, 31)   // March 31
  };
}

/**
 * Sort FY labels chronologically.
 */
function sortFYLabels(labels) {
  return [...labels].sort((a, b) => {
    const yearA = Number(a.match(/\d{4}/)[0]);
    const yearB = Number(b.match(/\d{4}/)[0]);
    return yearA - yearB;
  });
}

module.exports = {
  getFYLabel,
  getFYQuarter,
  getMonthName,
  getMonthYearLabel,
  parseDate,
  getFYDateRange,
  sortFYLabels
};
