/**
 * BUrn monEY — Category Budgets Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Handles category budget thresholds, visual states (<70% normal, 70-90% warning, >90% danger),
 * spent vs budget calculations, and accessible multi-indicator status labels.
 */

import { StorageService } from './storage.js';
import { calculateCategoryExpenses } from './calculations.js';

export const STANDARD_EXPENSE_CATEGORIES = [
  'Food',
  'Grocery',
  'Bills',
  'Travel',
  'Shopping',
  'Subscriptions',
  'Movie',
  'Healthcare',
  'Education',
  'Entertainment',
  'Other'
];

export const STANDARD_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Other Income'
];

export const BudgetsService = {
  getBudgets() {
    return StorageService.loadBudgets();
  },

  setBudget(category, amount) {
    const budgets = this.getBudgets();
    const limit = Math.max(0, parseFloat(amount) || 0);
    if (limit <= 0) {
      delete budgets[category];
    } else {
      budgets[category] = limit;
    }
    StorageService.saveBudgets(budgets);
    return budgets;
  },

  deleteBudget(category) {
    const budgets = this.getBudgets();
    delete budgets[category];
    StorageService.saveBudgets(budgets);
    return budgets;
  },

  /**
   * Compares budgets with active month's transaction expenses.
   */
  getBudgetAnalytics(transactions) {
    const budgets = this.getBudgets();
    const catExpenses = calculateCategoryExpenses(transactions);

    return Object.entries(budgets).map(([category, limit]) => {
      const spent = catExpenses[category] || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status = 'normal';
      let statusLabel = 'On Track';
      let icon = 'check-circle';

      if (percentage > 100) {
        status = 'danger';
        statusLabel = 'Budget Exceeded';
        icon = 'alert-triangle';
      } else if (percentage >= 90) {
        status = 'danger';
        statusLabel = 'Critical Warning';
        icon = 'alert-circle';
      } else if (percentage >= 70) {
        status = 'warning';
        statusLabel = 'Near Limit (70%+)';
        icon = 'alert-circle';
      }

      return {
        category,
        limit,
        spent,
        remaining,
        percentage: Math.min(150, Math.round(percentage)),
        actualPercentage: Math.round(percentage),
        status,
        statusLabel,
        icon
      };
    });
  }
};
