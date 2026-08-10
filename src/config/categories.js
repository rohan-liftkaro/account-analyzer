/**
 * Transaction category rules.
 * Each category has keywords that are matched against transaction descriptions.
 * Order matters — first match wins.
 */

const CATEGORIES = [
  {
    name: 'Salary / Income',
    type: 'credit',
    keywords: ['salary', 'payroll', 'wages', 'stipend', 'bonus', 'incentive', 'commission']
  },
  {
    name: 'Freelance / Business Income',
    type: 'credit',
    keywords: ['invoice', 'freelance', 'consulting', 'professional fees', 'client payment']
  },
  {
    name: 'Interest / Dividends',
    type: 'credit',
    keywords: ['interest', 'dividend', 'fd interest', 'rd interest', 'mutual fund', 'mf redemption']
  },
  {
    name: 'Refund / Cashback',
    type: 'credit',
    keywords: ['refund', 'cashback', 'reversal', 'chargeback', 'return']
  },
  {
    name: 'EMI / Loan',
    type: 'debit',
    keywords: ['emi', 'loan', 'home loan', 'car loan', 'personal loan', 'education loan', 'mortgage']
  },
  {
    name: 'Rent',
    type: 'debit',
    keywords: ['rent', 'house rent', 'pg rent', 'hostel', 'accommodation']
  },
  {
    name: 'Utilities / Bills',
    type: 'debit',
    keywords: ['electricity', 'electric', 'water bill', 'gas bill', 'broadband', 'internet', 'wifi',
      'phone bill', 'mobile recharge', 'dth', 'tata sky', 'airtel', 'jio', 'vi ', 'bsnl',
      'postpaid', 'prepaid']
  },
  {
    name: 'Insurance',
    type: 'debit',
    keywords: ['insurance', 'lic', 'term plan', 'health insurance', 'motor insurance', 'premium']
  },
  {
    name: 'Investment',
    type: 'debit',
    keywords: ['sip', 'mutual fund', 'mf purchase', 'equity', 'shares', 'stock', 'nps',
      'ppf', 'fixed deposit', 'fd', 'rd', 'zerodha', 'groww', 'kuvera', 'coin']
  },
  {
    name: 'Food & Dining',
    type: 'debit',
    keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'dominos',
      'pizza', 'burger', 'kfc', 'mcdonald', 'starbucks', 'chaayos', 'biryani']
  },
  {
    name: 'Shopping',
    type: 'debit',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'shopping', 'mall',
      'retail', 'store', 'mart', 'dmart', 'reliance', 'croma', 'electronics']
  },
  {
    name: 'Travel & Transport',
    type: 'debit',
    keywords: ['uber', 'ola', 'rapido', 'metro', 'railway', 'irctc', 'flight', 'makemytrip',
      'goibibo', 'redbus', 'bus', 'petrol', 'diesel', 'fuel', 'parking', 'toll',
      'fastag', 'cab', 'taxi', 'auto']
  },
  {
    name: 'Entertainment',
    type: 'debit',
    keywords: ['netflix', 'hotstar', 'prime video', 'spotify', 'youtube', 'movie',
      'cinema', 'pvr', 'inox', 'gaming', 'subscription', 'apple music']
  },
  {
    name: 'Healthcare',
    type: 'debit',
    keywords: ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine', 'apollo',
      'medplus', 'netmeds', 'pharmeasy', 'lab test', 'diagnostic', 'dental']
  },
  {
    name: 'Education',
    type: 'debit',
    keywords: ['school', 'college', 'university', 'tuition', 'course', 'udemy',
      'coursera', 'coaching', 'exam fee', 'books', 'stationery']
  },
  {
    name: 'UPI Transfer',
    type: 'both',
    keywords: ['upi', 'phonepe', 'gpay', 'google pay', 'paytm', 'bhim']
  },
  {
    name: 'Bank Transfer / NEFT / RTGS',
    type: 'both',
    keywords: ['neft', 'rtgs', 'imps', 'bank transfer', 'fund transfer', 'ifsc']
  },
  {
    name: 'ATM / Cash',
    type: 'debit',
    keywords: ['atm', 'cash withdrawal', 'cash deposit', 'self withdrawal']
  },
  {
    name: 'Tax',
    type: 'debit',
    keywords: ['income tax', 'gst', 'tds', 'advance tax', 'self assessment', 'tax payment']
  }
];

// Default category when no rule matches
const DEFAULT_CATEGORY = 'Others / Uncategorized';

module.exports = { CATEGORIES, DEFAULT_CATEGORY };
