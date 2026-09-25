/**
 * BUrn monEY — Transactions Management Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Handles transaction validation, CRUD operations, multi-criteria filtering,
 * real-time search, sorting, and XSS-safe data sanitization.
 */

import { StorageService } from './storage.js';
import { filterTransactionsByDate } from './calculations.js';

// Safe string escaping for HTML injection defense
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const TransactionsService = {
  getTransactions() {
    return StorageService.loadTransactions();
  },

  validateTransaction({ title, amount, type, category, date }) {
    const errors = [];

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Transaction title cannot be empty.');
    } else if (title.trim().length > 100) {
      errors.push('Title must be under 100 characters.');
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.push('Please enter a valid amount greater than ₹0.');
    } else if (numAmount > 100000000) {
      errors.push('Amount exceeds maximum permissible limit.');
    }

    if (!category || category.trim().length === 0) {
      errors.push('Please select a valid category.');
    }

    if (!date || isNaN(Date.parse(date))) {
      errors.push('Please provide a valid date.');
    }

    if (type !== 'income' && type !== 'expense') {
      errors.push('Type must be either income or expense.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  addTransaction({ title, amount, type, category, date, note = '' }) {
    const validation = this.validateTransaction({ title, amount, type, category, date });
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const transactions = this.getTransactions();
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      amount: Math.abs(parseFloat(amount)),
      type: type === 'income' ? 'income' : 'expense',
      category: category.trim(),
      date: date,
      note: (note || '').trim(),
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    StorageService.saveTransactions(transactions);
    return newTx;
  },

  updateTransaction(id, { title, amount, type, category, date, note = '' }) {
    const validation = this.validateTransaction({ title, amount, type, category, date });
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Transaction not found.');
    }

    const existing = transactions[index];
    const updated = {
      ...existing,
      title: title.trim(),
      amount: Math.abs(parseFloat(amount)),
      type: type === 'income' ? 'income' : 'expense',
      category: category.trim(),
      date: date,
      note: (note || '').trim()
    };

    transactions[index] = updated;
    StorageService.saveTransactions(transactions);
    return updated;
  },

  deleteTransaction(id) {
    let transactions = this.getTransactions();
    const exists = transactions.some(t => t.id === id);
    if (!exists) return false;

    transactions = transactions.filter(t => t.id !== id);
    StorageService.saveTransactions(transactions);
    return true;
  },

  clearAllTransactions() {
    StorageService.saveTransactions([]);
    return true;
  },

  /**
   * Applies search, type filter, category filter, date period, and sorting to transactions.
   */
  filterAndSort(transactions, filters = {}) {
    const {
      search = '',
      type = 'all',
      category = 'all',
      datePeriod = 'all_time',
      customStart = null,
      customEnd = null,
      sortBy = 'newest'
    } = filters;

    // 1. Date Period Filter
    let list = filterTransactionsByDate(transactions, datePeriod, customStart, customEnd);

    // 2. Type Filter
    if (type && type !== 'all') {
      list = list.filter(t => t.type === type);
    }

    // 3. Category Filter
    if (category && category !== 'all') {
      list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    // 4. Search Filter (title, category, note)
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q))
      );
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return diff !== 0 ? diff : (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
      if (sortBy === 'oldest') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return diff !== 0 ? diff : (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      }
      if (sortBy === 'highest') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'lowest') {
        return (a.amount || 0) - (b.amount || 0);
      }
      return 0;
    });

    return list;
  }
};
