/**
 * BUrn monEY — Financial Calculations Engine
 * Brand: BUrn monEY ("See where your money goes.")
 * Centralized calculation library for totals, savings rate, Indian Rupee formatting,
 * category breakdowns, monthly trends, date range filtering, and rule-based Health Score.
 */

// Formats amounts into Indian Rupee standard format (e.g. ₹1,25,000)
export function formatRupee(amount, options = { decimals: 0, compact: false }) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

  if (options.compact && Math.abs(num) >= 10000000) {
    return '₹' + (num / 10000000).toFixed(1) + ' Cr';
  }
  if (options.compact && Math.abs(num) >= 100000) {
    return '₹' + (num / 100000).toFixed(1) + ' L';
  }
  if (options.compact && Math.abs(num) >= 1000) {
    return '₹' + (num / 1000).toFixed(1) + 'k';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.decimals ? 2 : 0,
    maximumFractionDigits: options.decimals ? 2 : 0
  });

  return formatter.format(num);
}

export function calculateTotalIncome(transactions) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function calculateTotalExpense(transactions) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function calculateBalance(transactions) {
  const income = calculateTotalIncome(transactions);
  const expense = calculateTotalExpense(transactions);
  return income - expense;
}

export function calculateSavingsRate(income, expense) {
  const inc = parseFloat(income) || 0;
  const exp = parseFloat(expense) || 0;
  if (inc <= 0) return 0;
  const rate = ((inc - exp) / inc) * 100;
  return Math.max(-100, Math.min(100, Math.round(rate * 10) / 10));
}

// Category Breakdown for expenses
export function calculateCategoryExpenses(transactions) {
  if (!Array.isArray(transactions)) return {};
  const map = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + (parseFloat(t.amount) || 0);
    });
  return map;
}

// Category Breakdown for income
export function calculateCategoryIncomes(transactions) {
  if (!Array.isArray(transactions)) return {};
  const map = {};
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + (parseFloat(t.amount) || 0);
    });
  return map;
}

// 6-Month rolling trend calculation
export function calculateMonthlyTrend(transactions, numMonths = 6) {
  const now = new Date();
  const months = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-US', { month: 'short' });
    months.push({
      key: yearMonth,
      label: monthLabel,
      income: 0,
      expense: 0
    });
  }

  if (Array.isArray(transactions)) {
    transactions.forEach(t => {
      if (!t.date) return;
      const key = t.date.substring(0, 7); // YYYY-MM
      const bucket = months.find(m => m.key === key);
      if (bucket) {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'income') bucket.income += amt;
        else if (t.type === 'expense') bucket.expense += amt;
      }
    });
  }

  return months;
}

// Rule-based Financial Health Score (0 - 100)
export function calculateHealthScore(income, expense, budgets = {}, goals = [], transactions = []) {
  const inc = Math.max(0, parseFloat(income) || 0);
  const exp = Math.max(0, parseFloat(expense) || 0);

  if (transactions.length === 0) {
    return {
      score: 50,
      label: 'Getting Started',
      color: 'var(--text-muted)',
      description: 'Add your income and expenses to generate an accurate financial health assessment.'
    };
  }

  let score = 0;

  // 1. Savings Rate component (Max 35 points)
  if (inc > 0) {
    const sRate = ((inc - exp) / inc) * 100;
    if (sRate >= 35) score += 35;
    else if (sRate >= 20) score += 28;
    else if (sRate >= 10) score += 18;
    else if (sRate >= 0) score += 8;
    else score += 0; // deficit
  } else {
    score += (exp === 0 ? 20 : 5);
  }

  // 2. Expense to Income Ratio (Max 25 points)
  if (inc > 0) {
    const ratio = (exp / inc) * 100;
    if (ratio <= 50) score += 25;
    else if (ratio <= 70) score += 20;
    else if (ratio <= 85) score += 12;
    else if (ratio <= 100) score += 5;
    else score += 0;
  } else {
    score += (exp === 0 ? 15 : 0);
  }

  // 3. Budget Adherence (Max 20 points)
  const budgetKeys = Object.keys(budgets);
  if (budgetKeys.length > 0) {
    const categoryExpenses = calculateCategoryExpenses(transactions);
    let exceededCount = 0;
    budgetKeys.forEach(cat => {
      const budgetLimit = budgets[cat];
      const spent = categoryExpenses[cat] || 0;
      if (budgetLimit > 0 && spent > budgetLimit) {
        exceededCount++;
      }
    });
    if (exceededCount === 0) score += 20;
    else if (exceededCount === 1) score += 12;
    else score += 5;
  } else {
    score += 15; // default baseline when budgets are not yet set
  }

  // 4. Savings Goal Momentum (Max 10 points)
  if (goals.length > 0) {
    const hasProgress = goals.some(g => (g.currentAmount > 0) || g.isCompleted);
    const hasCompleted = goals.some(g => g.isCompleted);
    if (hasCompleted) score += 10;
    else if (hasProgress) score += 8;
    else score += 4;
  } else {
    score += 5;
  }

  // 5. Tracking Consistency (Max 10 points)
  if (transactions.length >= 10) score += 10;
  else if (transactions.length >= 5) score += 7;
  else score += 4;

  // Clamp 0 to 100
  score = Math.min(100, Math.max(5, Math.round(score)));

  let label = 'Balanced Stability';
  let color = 'var(--accent-primary)';
  let description = 'Your financial habits demonstrate solid tracking and healthy discipline.';

  if (score >= 85) {
    label = 'Excellent Health';
    color = 'var(--color-success)';
    description = 'Strong savings performance and healthy budget discipline. Your money is working efficiently.';
  } else if (score >= 70) {
    label = 'Good Financial Stability';
    color = 'var(--color-info)';
    description = 'Stable income-to-expense ratio. Maintaining this trajectory will steadily build your net worth.';
  } else if (score >= 50) {
    label = 'Fair / Needs Attention';
    color = 'var(--color-warning)';
    description = 'Your expenses are moderately high compared with your earnings. Monitor discretionary purchases.';
  } else {
    label = 'Critical Warning';
    color = 'var(--color-danger)';
    description = 'Your spending exceeds or matches your entire income. Prioritize controlling high-burn categories.';
  }

  return { score, label, color, description };
}

// Date Range Filtering
export function filterTransactionsByDate(transactions, period = 'all_time', customStart = null, customEnd = null) {
  if (!Array.isArray(transactions)) return [];
  if (period === 'all_time') return [...transactions];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return transactions.filter(tx => {
    if (!tx.date) return false;
    const txDate = new Date(tx.date);

    if (period === 'today') {
      return tx.date === todayStr;
    }

    if (period === 'this_week') {
      // Monday to Sunday of current week
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return txDate >= monday && txDate <= sunday;
    }

    if (period === 'this_month') {
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    }

    if (period === 'this_year') {
      return txDate.getFullYear() === now.getFullYear();
    }

    if (period === 'custom') {
      if (!customStart && !customEnd) return true;
      const start = customStart ? new Date(customStart + 'T00:00:00') : new Date('1970-01-01');
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date('2099-12-31');
      return txDate >= start && txDate <= end;
    }

    return true;
  });
}
