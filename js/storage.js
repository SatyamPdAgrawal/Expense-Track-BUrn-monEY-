/**
 * BUrn monEY — Storage Management Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Handles LocalStorage persistence, safe serialization, migrations, seed data, and CSV import/export.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'burnmoney_transactions',
  GOALS: 'burnmoney_goals',
  BUDGETS: 'burnmoney_budgets',
  ACHIEVEMENTS: 'burnmoney_achievements',
  THEME: 'burnmoney_theme',
  INITIALIZED: 'burnmoney_initialized_v1'
};

// Safe JSON parser with fallback
function safeJsonParse(jsonString, fallback) {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn('[BUrn monEY Storage] Failed to parse JSON, falling back:', err);
    return fallback;
  }
}

// Initial Seed Data to ensure instant delight on first load
function getSeedData() {
  const today = new Date();
  const formatOffsetDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const seedTransactions = [
    {
      id: 'tx_seed_1',
      title: 'Monthly Tech Salary',
      amount: 85000,
      type: 'income',
      category: 'Salary',
      date: formatOffsetDate(24),
      note: 'Direct bank deposit',
      createdAt: new Date(today.getTime() - 24 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_2',
      title: 'Apartment Rent & Maintenance',
      amount: 18000,
      type: 'expense',
      category: 'Bills',
      date: formatOffsetDate(23),
      note: 'UPI transfer to landlord',
      createdAt: new Date(today.getTime() - 23 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_3',
      title: 'Organic Supermarket Groceries',
      amount: 4250,
      type: 'expense',
      category: 'Grocery',
      date: formatOffsetDate(20),
      note: 'Weekly essentials and pantry restock',
      createdAt: new Date(today.getTime() - 20 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_4',
      title: 'Freelance UI/UX Design Consulting',
      amount: 22000,
      type: 'income',
      category: 'Freelance',
      date: formatOffsetDate(18),
      note: 'Fintech client milestone 1',
      createdAt: new Date(today.getTime() - 18 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_5',
      title: 'Artisan Cafe & Dinner with Friends',
      amount: 2350,
      type: 'expense',
      category: 'Food',
      date: formatOffsetDate(15),
      note: 'Weekend hangout',
      createdAt: new Date(today.getTime() - 15 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_6',
      title: 'Metro Pass & Uber Commutes',
      amount: 1450,
      type: 'expense',
      category: 'Travel',
      date: formatOffsetDate(12),
      note: 'Monthly city transit reload',
      createdAt: new Date(today.getTime() - 12 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_7',
      title: 'Spotify & Netflix Subscriptions',
      amount: 899,
      type: 'expense',
      category: 'Subscriptions',
      date: formatOffsetDate(10),
      note: 'Auto-debited digital services',
      createdAt: new Date(today.getTime() - 10 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_8',
      title: 'Cinema Tickets & IMAX Popcorn',
      amount: 1100,
      type: 'expense',
      category: 'Movie',
      date: formatOffsetDate(7),
      note: 'Friday evening premiere',
      createdAt: new Date(today.getTime() - 7 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_9',
      title: 'Ergonomic Desk Accessories',
      amount: 3200,
      type: 'expense',
      category: 'Shopping',
      date: formatOffsetDate(4),
      note: 'Work from home upgrade',
      createdAt: new Date(today.getTime() - 4 * 86400000).toISOString()
    },
    {
      id: 'tx_seed_10',
      title: 'Weekly Farm Fresh Vegetables',
      amount: 1280,
      type: 'expense',
      category: 'Grocery',
      date: formatOffsetDate(1),
      note: 'Local farmer market',
      createdAt: new Date(today.getTime() - 1 * 86400000).toISOString()
    }
  ];

  const seedGoals = [
    {
      id: 'goal_seed_1',
      title: 'Emergency Cushion',
      targetAmount: 75000,
      currentAmount: 45000,
      targetDate: '2026-12-31',
      category: 'Savings',
      isCompleted: false,
      completedAt: null,
      celebrated: false
    },
    {
      id: 'goal_seed_2',
      title: 'New M3 MacBook Pro',
      targetAmount: 130000,
      currentAmount: 68000,
      targetDate: '2027-03-31',
      category: 'Gadgets',
      isCompleted: false,
      completedAt: null,
      celebrated: false
    },
    {
      id: 'goal_seed_3',
      title: 'Goa Weekend Getaway',
      targetAmount: 25000,
      currentAmount: 25000,
      targetDate: '2026-08-15',
      category: 'Travel',
      isCompleted: true,
      completedAt: formatOffsetDate(30),
      celebrated: true // Already celebrated, do not trigger confetti on load!
    }
  ];

  const seedBudgets = {
    Food: 6000,
    Grocery: 8000,
    Bills: 20000,
    Shopping: 7000,
    Travel: 4000,
    Subscriptions: 2000,
    Movie: 2500
  };

  return { seedTransactions, seedGoals, seedBudgets };
}

export const StorageService = {
  init() {
    try {
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!isInitialized) {
        const { seedTransactions, seedGoals, seedBudgets } = getSeedData();
        this.saveTransactions(seedTransactions);
        this.saveGoals(seedGoals);
        this.saveBudgets(seedBudgets);
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
    } catch (err) {
      console.error('[BUrn monEY Storage] Initialization error:', err);
    }
  },

  // Transactions
  loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const list = safeJsonParse(raw, []);
      if (!Array.isArray(list)) return [];
      // Cleanse and sanitize transactions
      return list.map(tx => ({
        id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: String(tx.title || 'Untitled Transaction').trim(),
        amount: Math.abs(parseFloat(tx.amount) || 0),
        type: tx.type === 'income' ? 'income' : 'expense',
        category: String(tx.category || 'Other').trim(),
        date: tx.date || new Date().toISOString().split('T')[0],
        note: String(tx.note || '').trim(),
        createdAt: tx.createdAt || new Date().toISOString()
      }));
    } catch (err) {
      console.error('[BUrn monEY Storage] loadTransactions failed:', err);
      return [];
    }
  },

  saveTransactions(transactions) {
    try {
      if (!Array.isArray(transactions)) transactions = [];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (err) {
      console.error('[BUrn monEY Storage] saveTransactions failed:', err);
      return false;
    }
  },

  // Goals
  loadGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      const list = safeJsonParse(raw, []);
      if (!Array.isArray(list)) return [];
      return list.map(g => ({
        id: g.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: String(g.title || 'Savings Goal').trim(),
        targetAmount: Math.max(1, parseFloat(g.targetAmount) || 1),
        currentAmount: Math.max(0, parseFloat(g.currentAmount) || 0),
        targetDate: g.targetDate || '',
        category: g.category || 'Savings',
        isCompleted: Boolean(g.isCompleted || (parseFloat(g.currentAmount) >= parseFloat(g.targetAmount))),
        completedAt: g.completedAt || null,
        celebrated: Boolean(g.celebrated)
      }));
    } catch (err) {
      console.error('[BUrn monEY Storage] loadGoals failed:', err);
      return [];
    }
  },

  saveGoals(goals) {
    try {
      if (!Array.isArray(goals)) goals = [];
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
      return true;
    } catch (err) {
      console.error('[BUrn monEY Storage] saveGoals failed:', err);
      return false;
    }
  },

  // Budgets (Object: { [category]: number })
  loadBudgets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      const parsed = safeJsonParse(raw, {});
      if (typeof parsed !== 'object' || parsed === null) return {};
      const sanitized = {};
      for (const [k, v] of Object.entries(parsed)) {
        sanitized[k] = Math.max(0, parseFloat(v) || 0);
      }
      return sanitized;
    } catch (err) {
      console.error('[BUrn monEY Storage] loadBudgets failed:', err);
      return {};
    }
  },

  saveBudgets(budgets) {
    try {
      if (typeof budgets !== 'object' || budgets === null) budgets = {};
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      return true;
    } catch (err) {
      console.error('[BUrn monEY Storage] saveBudgets failed:', err);
      return false;
    }
  },

  // Achievements
  loadAchievements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return safeJsonParse(raw, {});
    } catch (err) {
      console.error('[BUrn monEY Storage] loadAchievements failed:', err);
      return {};
    }
  },

  saveAchievements(achievements) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
      return true;
    } catch (err) {
      console.error('[BUrn monEY Storage] saveAchievements failed:', err);
      return false;
    }
  },

  // Theme
  loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    } catch {
      return 'dark';
    }
  },

  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (err) {
      console.warn('[BUrn monEY Storage] saveTheme failed:', err);
    }
  },

  // CSV Export
  exportTransactionsToCSV(transactions) {
    if (!transactions || !transactions.length) {
      throw new Error('No transactions available to export.');
    }

    const headers = ['Date', 'Title', 'Amount', 'Type', 'Category', 'Note'];
    const rows = transactions.map(t => [
      `"${(t.date || '').replace(/"/g, '""')}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      (t.amount || 0).toFixed(2),
      `"${(t.type || 'expense').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `burn_money_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // CSV Import (RFC 4180 parsing with validation)
  parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing data rows.');
    }

    // Split CSV line respecting quoted fields
    const parseLine = (text) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur);
      return result;
    };

    const headerLine = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    const dateIdx = headerLine.indexOf('date');
    const titleIdx = headerLine.indexOf('title');
    const amountIdx = headerLine.indexOf('amount');
    const typeIdx = headerLine.indexOf('type');
    const catIdx = headerLine.indexOf('category');
    const noteIdx = headerLine.indexOf('note');

    if (dateIdx === -1 || titleIdx === -1 || amountIdx === -1) {
      throw new Error('CSV must contain at least "Date", "Title", and "Amount" columns.');
    }

    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = parseLine(lines[i]);
      if (parts.length < 3) continue;

      const title = (parts[titleIdx] || '').trim();
      const amount = parseFloat(parts[amountIdx]);
      if (!title || isNaN(amount) || amount <= 0) continue;

      const dateStr = (parts[dateIdx] || '').trim();
      const type = (typeIdx !== -1 && parts[typeIdx]) ? parts[typeIdx].trim().toLowerCase() : 'expense';
      const category = (catIdx !== -1 && parts[catIdx]) ? parts[catIdx].trim() : 'Other';
      const note = (noteIdx !== -1 && parts[noteIdx]) ? parts[noteIdx].trim() : '';

      imported.push({
        id: `tx_imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title,
        amount: Math.abs(amount),
        type: type === 'income' ? 'income' : 'expense',
        category: category || 'Other',
        date: dateStr || new Date().toISOString().split('T')[0],
        note,
        createdAt: new Date().toISOString()
      });
    }

    if (imported.length === 0) {
      throw new Error('No valid transaction records could be parsed from the CSV.');
    }

    return imported;
  }
};
