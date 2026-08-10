/**
 * Sample Data Generator.
 * Creates realistic sample bank statement CSV files for testing.
 *
 * Run: node src/generateSampleData.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'input');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Transaction Templates ───
const CREDIT_TEMPLATES = [
  { desc: 'SALARY CREDIT FROM TECHCORP PVT LTD', range: [45000, 120000] },
  { desc: 'NEFT-CR-FREELANCE PAYMENT-INV', range: [15000, 50000] },
  { desc: 'UPI-GPAY-REFUND', range: [100, 3000] },
  { desc: 'INTEREST CREDITED-SB A/C', range: [50, 800] },
  { desc: 'FD INTEREST CREDIT', range: [2000, 8000] },
  { desc: 'CASHBACK-AMAZON PAY', range: [50, 500] },
  { desc: 'NEFT-CR-RENTAL INCOME', range: [8000, 25000] },
  { desc: 'DIVIDEND CREDIT-MUTUAL FUND', range: [500, 5000] },
];

const DEBIT_TEMPLATES = [
  { desc: 'UPI-SWIGGY-FOOD ORDER', range: [150, 800], freq: 'high' },
  { desc: 'UPI-ZOMATO-FOOD DELIVERY', range: [200, 900], freq: 'high' },
  { desc: 'UPI-PHONEPE-GROCERY', range: [300, 2500], freq: 'medium' },
  { desc: 'AMAZON PAY-SHOPPING', range: [500, 15000], freq: 'medium' },
  { desc: 'FLIPKART-ONLINE PURCHASE', range: [300, 8000], freq: 'low' },
  { desc: 'EMI-HOME LOAN-HDFC', range: [18000, 25000], freq: 'monthly' },
  { desc: 'RENT-TRANSFER TO LANDLORD', range: [12000, 22000], freq: 'monthly' },
  { desc: 'ELECTRICITY BILL-TATA POWER', range: [800, 3500], freq: 'monthly' },
  { desc: 'BROADBAND-AIRTEL XSTREAM', range: [799, 1499], freq: 'monthly' },
  { desc: 'MOBILE RECHARGE-JIO', range: [239, 599], freq: 'monthly' },
  { desc: 'UBER-CAB RIDE', range: [100, 600], freq: 'high' },
  { desc: 'OLA-AUTO RIDE', range: [50, 300], freq: 'high' },
  { desc: 'IRCTC-RAILWAY TICKET', range: [200, 3500], freq: 'low' },
  { desc: 'PETROL-INDIAN OIL', range: [500, 3000], freq: 'medium' },
  { desc: 'NETFLIX-SUBSCRIPTION', range: [199, 649], freq: 'monthly' },
  { desc: 'SPOTIFY-PREMIUM', range: [119, 179], freq: 'monthly' },
  { desc: 'ATM-CASH WITHDRAWAL', range: [2000, 10000], freq: 'medium' },
  { desc: 'SIP-MUTUAL FUND-GROWW', range: [5000, 15000], freq: 'monthly' },
  { desc: 'INSURANCE-LIC PREMIUM', range: [3000, 12000], freq: 'quarterly' },
  { desc: 'MEDICAL-APOLLO PHARMACY', range: [200, 2000], freq: 'low' },
  { desc: 'UPI-GPAY-MISCELLANEOUS', range: [100, 5000], freq: 'high' },
  { desc: 'MYNTRA-FASHION PURCHASE', range: [500, 5000], freq: 'low' },
  { desc: 'INCOME TAX-ADVANCE TAX', range: [10000, 50000], freq: 'quarterly' },
  { desc: 'SCHOOL FEE-DPS', range: [5000, 15000], freq: 'quarterly' },
  { desc: 'WATER BILL-MUNICIPAL CORP', range: [200, 800], freq: 'monthly' },
];

function random(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Generate transactions for one FY.
 */
function generateFY(startYear) {
  const transactions = [];
  let balance = random(50000, 200000);
  const startDate = new Date(startYear, 3, 1); // April 1
  const endDate = new Date(startYear + 1, 2, 31); // March 31

  // Monthly fixed transactions
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(monthDate.getMonth() + m);

    // Salary (1st or 2nd of month)
    const salaryDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), random(1, 3));
    if (salaryDate <= endDate) {
      const salary = randomChoice(CREDIT_TEMPLATES.filter(t => t.desc.includes('SALARY')));
      const amt = random(...salary.range);
      balance += amt;
      transactions.push({
        date: salaryDate,
        desc: salary.desc,
        debit: 0,
        credit: amt,
        balance
      });
    }

    // Monthly bills
    DEBIT_TEMPLATES.filter(t => t.freq === 'monthly').forEach(template => {
      const day = Math.floor(random(5, 28));
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date <= endDate && date >= startDate) {
        const amt = random(...template.range);
        balance -= amt;
        transactions.push({
          date,
          desc: template.desc,
          debit: amt,
          credit: 0,
          balance
        });
      }
    });

    // Quarterly transactions
    if (m % 3 === 0) {
      DEBIT_TEMPLATES.filter(t => t.freq === 'quarterly').forEach(template => {
        const day = Math.floor(random(10, 25));
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        if (date <= endDate && date >= startDate) {
          const amt = random(...template.range);
          balance -= amt;
          transactions.push({
            date,
            desc: template.desc,
            debit: amt,
            credit: 0,
            balance
          });
        }
      });
    }

    // Variable-frequency transactions (random count per month)
    const highFreq = DEBIT_TEMPLATES.filter(t => t.freq === 'high');
    const medFreq = DEBIT_TEMPLATES.filter(t => t.freq === 'medium');
    const lowFreq = DEBIT_TEMPLATES.filter(t => t.freq === 'low');

    // High frequency: 8-15 per month
    for (let i = 0; i < Math.floor(random(8, 15)); i++) {
      const template = randomChoice(highFreq);
      const day = Math.floor(random(1, 28));
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date <= endDate && date >= startDate) {
        const amt = random(...template.range);
        balance -= amt;
        transactions.push({
          date,
          desc: template.desc + `-${Math.floor(random(1000, 9999))}`,
          debit: amt,
          credit: 0,
          balance
        });
      }
    }

    // Medium frequency: 3-6 per month
    for (let i = 0; i < Math.floor(random(3, 6)); i++) {
      const template = randomChoice(medFreq);
      const day = Math.floor(random(1, 28));
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date <= endDate && date >= startDate) {
        const amt = random(...template.range);
        balance -= amt;
        transactions.push({
          date,
          desc: template.desc + `-${Math.floor(random(1000, 9999))}`,
          debit: amt,
          credit: 0,
          balance
        });
      }
    }

    // Low frequency: 0-2 per month
    for (let i = 0; i < Math.floor(random(0, 2)); i++) {
      const template = randomChoice(lowFreq);
      const day = Math.floor(random(1, 28));
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date <= endDate && date >= startDate) {
        const amt = random(...template.range);
        balance -= amt;
        transactions.push({
          date,
          desc: template.desc + `-${Math.floor(random(1000, 9999))}`,
          debit: amt,
          credit: 0,
          balance
        });
      }
    }

    // Random credits (freelance, refunds, etc.)
    if (Math.random() > 0.5) {
      const template = randomChoice(CREDIT_TEMPLATES.filter(t => !t.desc.includes('SALARY')));
      const day = Math.floor(random(5, 25));
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date <= endDate && date >= startDate) {
        const amt = random(...template.range);
        balance += amt;
        transactions.push({
          date,
          desc: template.desc,
          debit: 0,
          credit: amt,
          balance
        });
      }
    }
  }

  // Sort by date
  transactions.sort((a, b) => a.date - b.date);
  return transactions;
}

/**
 * Write transactions to CSV.
 */
function writeCSV(fileName, transactions) {
  const header = 'Date,Description,Debit,Credit,Balance\n';
  const rows = transactions.map(t =>
    `${formatDate(t.date)},"${t.desc}",${t.debit || ''},${t.credit || ''},${t.balance.toFixed(2)}`
  ).join('\n');

  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, header + rows, 'utf-8');
  console.log(`✓ Generated: ${filePath} (${transactions.length} transactions)`);
}

// ─── Generate FYs ───
console.log('\n📄 Generating sample bank statement data for Financial Years...\n');

const fyStartYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

for (const startYear of fyStartYears) {
  const fy = `FY${startYear}-${String(startYear + 1).slice(2)}`;
  const transactions = generateFY(startYear);
  writeCSV(`bank_statement_${fy}.csv`, transactions);
}

console.log('\n✔ Sample data generation complete!');
console.log(`  Files saved to: ${OUTPUT_DIR}\n`);
