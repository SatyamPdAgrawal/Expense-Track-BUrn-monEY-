/**
 * BUrn monEY — Main Application Controller
 * Brand: BUrn monEY ("See where your money goes.")
 * Connects storage, calculations, transactions, charts, goals, budgets, insights, achievements, and UI.
 */

import { StorageService } from './storage.js';
import {
  formatRupee,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance,
  calculateSavingsRate,
  calculateHealthScore
} from './calculations.js';
import { TransactionsService, escapeHTML } from './transactions.js';
import { ChartsService } from './charts.js';
import { GoalsService } from './goals.js';
import { BudgetsService, STANDARD_EXPENSE_CATEGORIES, STANDARD_INCOME_CATEGORIES } from './budgets.js';
import { SmartInsightsEngine } from './insights.js';
import { AchievementsService } from './achievements.js';
import { UIService } from './ui.js';

// Application State
const AppState = {
  transactions: [],
  goals: [],
  budgets: {},
  achievements: [],
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    datePeriod: 'all_time',
    customStart: null,
    customEnd: null,
    sortBy: 'newest'
  },
  transactionToEdit: null,
  transactionToDeleteId: null,
  goalToFundId: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  StorageService.init();
  UIService.init();
  populateCategorySelects();
  bindEventListeners();
  loadDataAndRender();
});

// Category Dropdown options setup
function populateCategorySelects() {
  const expenseCatSelect = document.getElementById('tx-category-select');
  const filterCatSelect = document.getElementById('filter-category');
  const budgetCatSelect = document.getElementById('budget-category-select');

  const allCategories = [...new Set([...STANDARD_EXPENSE_CATEGORIES, ...STANDARD_INCOME_CATEGORIES])].sort();

  if (filterCatSelect) {
    filterCatSelect.innerHTML = `<option value="all">All Categories</option>`;
    allCategories.forEach(cat => {
      filterCatSelect.innerHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
  }

  if (budgetCatSelect) {
    budgetCatSelect.innerHTML = STANDARD_EXPENSE_CATEGORIES.map(cat =>
      `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`
    ).join('');
  }

  updateCategoryDropdownForType('expense');
}

function updateCategoryDropdownForType(type) {
  const select = document.getElementById('tx-category-select');
  if (!select) return;

  const cats = type === 'income' ? STANDARD_INCOME_CATEGORIES : STANDARD_EXPENSE_CATEGORIES;
  select.innerHTML = cats.map(cat => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join('');
}

// Master Load & Re-render
function loadDataAndRender() {
  AppState.transactions = TransactionsService.getTransactions();
  AppState.goals = GoalsService.getGoals();
  AppState.budgets = BudgetsService.getBudgets();
  AppState.achievements = AchievementsService.getAchievements();

  // Evaluate any newly achieved badges
  const newBadges = AchievementsService.checkAchievements({
    transactions: AppState.transactions,
    goals: AppState.goals
  });
  newBadges.forEach(badge => {
    UIService.showToast(`Achievement Unlocked: ${badge.title}! 🏆`, 'success', 4500);
  });

  renderDashboardSummary();
  renderHealthScore();
  renderSmartInsights();
  renderCharts();
  renderBudgets();
  renderGoals();
  renderTransactions();
  renderAchievements();
}

// 1. Dashboard Summary Cards
function renderDashboardSummary() {
  // Filtered transactions for active date range
  const filtered = TransactionsService.filterAndSort(AppState.transactions, {
    datePeriod: AppState.filters.datePeriod,
    customStart: AppState.filters.customStart,
    customEnd: AppState.filters.customEnd
  });

  const totalIncome = calculateTotalIncome(filtered);
  const totalExpense = calculateTotalExpense(filtered);
  const balance = totalIncome - totalExpense;
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense);

  const elBalance = document.getElementById('summary-total-balance');
  const elIncome = document.getElementById('summary-total-income');
  const elExpense = document.getElementById('summary-total-expenses');
  const elSavings = document.getElementById('summary-savings-rate');

  if (elBalance) elBalance.textContent = formatRupee(balance);
  if (elIncome) elIncome.textContent = formatRupee(totalIncome);
  if (elExpense) elExpense.textContent = formatRupee(totalExpense);
  if (elSavings) {
    if (totalIncome === 0) {
      elSavings.textContent = '0%';
    } else {
      elSavings.textContent = `${savingsRate}%`;
    }
  }

  // Update Period Label in Card Subtext
  const periodTextMap = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    this_year: 'This Year',
    all_time: 'All Time',
    custom: 'Custom Period'
  };
  const activePeriodText = periodTextMap[AppState.filters.datePeriod] || 'Selected Period';
  document.querySelectorAll('.period-label-text').forEach(el => {
    el.textContent = activePeriodText;
  });
}

// 2. Financial Health Score
function renderHealthScore() {
  const filtered = TransactionsService.filterAndSort(AppState.transactions, {
    datePeriod: AppState.filters.datePeriod,
    customStart: AppState.filters.customStart,
    customEnd: AppState.filters.customEnd
  });

  const totalIncome = calculateTotalIncome(filtered);
  const totalExpense = calculateTotalExpense(filtered);

  const result = calculateHealthScore(
    totalIncome,
    totalExpense,
    AppState.budgets,
    AppState.goals,
    filtered
  );

  const scoreNum = document.getElementById('health-score-value');
  const badge = document.getElementById('health-status-badge');
  const fill = document.getElementById('health-meter-fill');
  const explanation = document.getElementById('health-explanation-text');

  if (scoreNum) scoreNum.textContent = result.score;
  if (badge) {
    badge.textContent = result.label;
    badge.style.backgroundColor = `${result.color}22`;
    badge.style.color = result.color;
  }
  if (fill) {
    fill.style.width = `${result.score}%`;
    fill.style.backgroundColor = result.color;
  }
  if (explanation) explanation.textContent = result.description;
}

// 3. Smart Insights Engine
function renderSmartInsights() {
  const container = document.getElementById('smart-insights-grid');
  if (!container) return;

  const filtered = TransactionsService.filterAndSort(AppState.transactions, {
    datePeriod: AppState.filters.datePeriod,
    customStart: AppState.filters.customStart,
    customEnd: AppState.filters.customEnd
  });

  const insights = SmartInsightsEngine.generateInsights({
    transactions: filtered,
    budgets: AppState.budgets,
    goals: AppState.goals
  });

  container.innerHTML = insights.map(item => `
    <div class="insight-card insight-${item.type}">
      <div class="insight-card-top">
        <div class="insight-title-group">
          <div class="insight-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <span class="insight-title">${escapeHTML(item.title)}</span>
        </div>
        ${item.metric ? `<span class="insight-metric-pill">${escapeHTML(item.metric)}</span>` : ''}
      </div>
      <p class="insight-message">${escapeHTML(item.message)}</p>
    </div>
  `).join('');
}

// 4. Charts Visualizations
function renderCharts() {
  const filtered = TransactionsService.filterAndSort(AppState.transactions, {
    datePeriod: AppState.filters.datePeriod,
    customStart: AppState.filters.customStart,
    customEnd: AppState.filters.customEnd
  });

  const totalIncome = calculateTotalIncome(filtered);
  const totalExpense = calculateTotalExpense(filtered);

  ChartsService.renderIncomeVsExpenseChart('chart-income-expense', totalIncome, totalExpense);
  ChartsService.renderCategorySpendingChart('chart-category-spending', filtered);
  ChartsService.renderMonthlyTrendChart('chart-monthly-trend', AppState.transactions);
}

// 5. Budgets System
function renderBudgets() {
  const container = document.getElementById('budgets-list-container');
  if (!container) return;

  const currentMonthTransactions = TransactionsService.filterAndSort(AppState.transactions, {
    datePeriod: 'this_month'
  });

  const items = BudgetsService.getBudgetAnalytics(currentMonthTransactions);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-wrap" style="padding: 1.5rem;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <p>No category budgets set yet.</p>
        <button class="btn btn-secondary btn-sm" id="btn-quick-add-budget">Set Category Budget</button>
      </div>
    `;
    const btn = container.querySelector('#btn-quick-add-budget');
    if (btn) btn.addEventListener('click', () => UIService.openModal('modal-budget'));
    return;
  }

  container.innerHTML = items.map(item => {
    const isOver = item.remaining < 0;
    const remainingText = isOver
      ? `Exceeded by ${formatRupee(Math.abs(item.remaining))}`
      : `${formatRupee(item.remaining)} remaining`;

    const fillColor = item.status === 'danger'
      ? 'var(--color-expense)'
      : item.status === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-income)';

    return `
      <div class="budget-item" data-category="${escapeHTML(item.category)}">
        <div class="budget-item-top">
          <div class="budget-cat-name">${escapeHTML(item.category)}</div>
          <span class="budget-badge budget-badge-${item.status}">
            ${escapeHTML(item.statusLabel)} (${item.actualPercentage}%)
          </span>
        </div>
        <div class="budget-progress-track">
          <div class="budget-progress-fill" style="width: ${Math.min(100, item.percentage)}%; background-color: ${fillColor};"></div>
        </div>
        <div class="budget-item-numbers">
          <span class="budget-spent">${formatRupee(item.spent)} of ${formatRupee(item.limit)}</span>
          <span class="budget-remaining ${isOver ? 'over' : ''}">${remainingText}</span>
        </div>
      </div>
    `;
  }).join('');
}

// 6. Savings Goals
function renderGoals() {
  const activeContainer = document.getElementById('active-goals-list');
  const completedContainer = document.getElementById('completed-goals-list');
  const completedWrapper = document.getElementById('completed-goals-wrapper');
  if (!activeContainer) return;

  const goals = AppState.goals;
  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  if (activeGoals.length === 0) {
    activeContainer.innerHTML = `
      <div class="empty-state-wrap" style="padding: 1.5rem;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="m10 15 5-3-5-3v6Z"></path></svg>
        <p>No active savings goals. Set a financial target to stay motivated!</p>
        <button class="btn btn-secondary btn-sm" id="btn-quick-add-goal">Create New Goal</button>
      </div>
    `;
    const btn = activeContainer.querySelector('#btn-quick-add-goal');
    if (btn) btn.addEventListener('click', () => UIService.openModal('modal-goal'));
  } else {
    activeContainer.innerHTML = activeGoals.map(goal => {
      const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
      return `
        <div class="goal-card" data-goal-id="${goal.id}">
          <div class="goal-card-top">
            <div>
              <h4 class="goal-title">${escapeHTML(goal.title)}</h4>
              <span class="goal-meta">${goal.category} ${goal.targetDate ? `• Target: ${goal.targetDate}` : ''}</span>
            </div>
            <span class="goal-percentage">${pct}%</span>
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="goal-numbers">
            <span class="goal-amounts">${formatRupee(goal.currentAmount)} of ${formatRupee(goal.targetAmount)}</span>
          </div>
          <div class="goal-actions">
            <button class="btn btn-secondary btn-sm btn-fund-goal" data-id="${goal.id}">+ Add Funds</button>
            <button class="btn btn-outline btn-sm btn-edit-goal" data-id="${goal.id}">Edit</button>
            <button class="btn btn-outline btn-sm btn-delete-goal" data-id="${goal.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach actions
    activeContainer.querySelectorAll('.btn-fund-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.goalToFundId = btn.getAttribute('data-id');
        const goal = AppState.goals.find(g => g.id === AppState.goalToFundId);
        if (goal) {
          const titleEl = document.getElementById('fund-goal-modal-title');
          if (titleEl) titleEl.textContent = `Deposit Funds: ${goal.title}`;
          UIService.openModal('modal-fund-goal');
        }
      });
    });

    activeContainer.querySelectorAll('.btn-edit-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditGoalModal(id);
      });
    });

    activeContainer.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this savings goal?')) {
          GoalsService.deleteGoal(id);
          UIService.showToast('Goal deleted', 'info');
          loadDataAndRender();
        }
      });
    });
  }

  // Completed Goals Section
  if (completedGoals.length > 0 && completedWrapper && completedContainer) {
    completedWrapper.style.display = 'block';
    completedContainer.innerHTML = completedGoals.map(goal => `
      <div class="completed-goal-badge">
        <div>
          <strong>${escapeHTML(goal.title)}</strong> (${formatRupee(goal.targetAmount)})
          <div style="font-size: 0.725rem; color: var(--text-muted);">Achieved on ${goal.completedAt || 'Completed'}</div>
        </div>
        <span style="color: var(--color-income); font-weight: 700;">100% Smashed ✓</span>
      </div>
    `).join('');
  } else if (completedWrapper) {
    completedWrapper.style.display = 'none';
  }
}

// 7. Transactions History (Desktop Table & Mobile Responsive Cards)
function renderTransactions() {
  const tableBody = document.getElementById('transactions-table-body');
  const mobileCardsContainer = document.getElementById('transactions-mobile-cards');
  const countBadge = document.getElementById('tx-count-badge');
  if (!tableBody || !mobileCardsContainer) return;

  const filtered = TransactionsService.filterAndSort(AppState.transactions, AppState.filters);

  if (countBadge) {
    countBadge.textContent = `${filtered.length} transaction${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    const emptyHtml = `
      <div class="empty-state-wrap">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        <h4>No transactions found</h4>
        <p>No records match your search or filter criteria. Add a transaction or clear filters.</p>
      </div>
    `;
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">${emptyHtml}</td></tr>`;
    mobileCardsContainer.innerHTML = emptyHtml;
    return;
  }

  // Render Desktop Table Rows (Safe text escaping, NO screenLeft typo!)
  tableBody.innerHTML = filtered.map(tx => {
    const isIncome = tx.type === 'income';
    const amountPrefix = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';

    return `
      <tr data-id="${tx.id}">
        <td class="tx-date-cell">${escapeHTML(tx.date)}</td>
        <td>
          <span class="tx-title-main">${escapeHTML(tx.title)}</span>
          ${tx.note ? `<span class="tx-title-note">${escapeHTML(tx.note)}</span>` : ''}
        </td>
        <td><span class="tx-cat-badge">${escapeHTML(tx.category)}</span></td>
        <td><span class="tx-type-tag tx-type-${tx.type}">${escapeHTML(tx.type)}</span></td>
        <td class="tx-amount ${amountClass}">${amountPrefix} ${formatRupee(tx.amount)}</td>
        <td class="tx-actions">
          <button type="button" class="btn-icon btn-sm btn-edit-tx" data-id="${tx.id}" aria-label="Edit transaction" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="btn-icon btn-sm btn-delete-tx" data-id="${tx.id}" aria-label="Delete transaction" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Render Mobile Cards
  mobileCardsContainer.innerHTML = filtered.map(tx => {
    const isIncome = tx.type === 'income';
    const amountPrefix = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';

    return `
      <div class="tx-mobile-card" data-id="${tx.id}">
        <div class="tx-card-header">
          <div>
            <span class="tx-title-main">${escapeHTML(tx.title)}</span>
            <span class="tx-date-cell">${escapeHTML(tx.date)} • ${escapeHTML(tx.category)}</span>
          </div>
          <span class="tx-amount ${amountClass}">${amountPrefix} ${formatRupee(tx.amount)}</span>
        </div>
        ${tx.note ? `<div class="tx-title-note">${escapeHTML(tx.note)}</div>` : ''}
        <div class="tx-card-body">
          <span class="tx-type-tag tx-type-${tx.type}">${escapeHTML(tx.type)}</span>
          <div class="tx-actions">
            <button type="button" class="btn btn-outline btn-sm btn-edit-tx" data-id="${tx.id}">Edit</button>
            <button type="button" class="btn btn-outline btn-sm btn-delete-tx" data-id="${tx.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Edit and Delete listeners
  document.querySelectorAll('.btn-edit-tx').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditTransactionModal(id);
    });
  });

  document.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openDeleteConfirmationModal(id);
    });
  });
}

// 8. Achievements Showcase
function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  const badges = AppState.achievements;
  container.innerHTML = badges.map(badge => `
    <div class="achievement-card ${badge.unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-badge-icon" style="color: ${badge.color};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      </div>
      <div class="achievement-info">
        <h4 class="achievement-title">${escapeHTML(badge.title)} ${badge.unlocked ? '✓' : ''}</h4>
        <p class="achievement-desc">${escapeHTML(badge.description)}</p>
      </div>
    </div>
  `).join('');
}

// Transaction Modal Handlers
function openAddTransactionModal() {
  AppState.transactionToEdit = null;
  const form = document.getElementById('transaction-form');
  if (form) form.reset();

  document.getElementById('tx-modal-title').textContent = 'Add Transaction';
  document.getElementById('tx-id').value = '';
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

  // Default to Expense
  setTransactionFormType('expense');

  UIService.openModal('modal-transaction');
}

function openEditTransactionModal(id) {
  const tx = AppState.transactions.find(t => t.id === id);
  if (!tx) return;

  AppState.transactionToEdit = tx;
  document.getElementById('tx-modal-title').textContent = 'Edit Transaction';
  document.getElementById('tx-id').value = tx.id;
  document.getElementById('tx-title').value = tx.title;
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-note').value = tx.note || '';

  setTransactionFormType(tx.type);
  const catSelect = document.getElementById('tx-category-select');
  if (catSelect) catSelect.value = tx.category;

  UIService.openModal('modal-transaction');
}

function setTransactionFormType(type) {
  const inputType = document.getElementById('tx-type');
  if (inputType) inputType.value = type;

  const btnExpense = document.getElementById('btn-type-expense');
  const btnIncome = document.getElementById('btn-type-income');

  if (type === 'expense') {
    if (btnExpense) btnExpense.classList.add('active');
    if (btnIncome) btnIncome.classList.remove('active');
  } else {
    if (btnExpense) btnExpense.classList.remove('active');
    if (btnIncome) btnIncome.classList.add('active');
  }

  updateCategoryDropdownForType(type);
}

function openDeleteConfirmationModal(id) {
  AppState.transactionToDeleteId = id;
  const tx = AppState.transactions.find(t => t.id === id);
  const titleEl = document.getElementById('delete-tx-name');
  if (titleEl && tx) {
    titleEl.textContent = `"${tx.title}" (${formatRupee(tx.amount)})`;
  }
  UIService.openModal('modal-delete-confirm');
}

function openEditGoalModal(id) {
  const goal = AppState.goals.find(g => g.id === id);
  if (!goal) return;

  document.getElementById('goal-modal-title').textContent = 'Edit Savings Goal';
  document.getElementById('goal-id').value = goal.id;
  document.getElementById('goal-title').value = goal.title;
  document.getElementById('goal-target-amount').value = goal.targetAmount;
  document.getElementById('goal-current-amount').value = goal.currentAmount;
  document.getElementById('goal-date').value = goal.targetDate || '';
  document.getElementById('goal-category').value = goal.category || 'Savings';

  UIService.openModal('modal-goal');
}

// Bind Application Event Listeners
function bindEventListeners() {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      UIService.toggleTheme();
      renderCharts(); // Re-render charts with new theme colors
    });
  }

  // Quick Action Buttons
  const btnAddTx = document.getElementById('btn-add-transaction');
  if (btnAddTx) btnAddTx.addEventListener('click', openAddTransactionModal);

  const btnAddGoal = document.getElementById('btn-add-goal');
  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', () => {
      const form = document.getElementById('goal-form');
      if (form) form.reset();
      document.getElementById('goal-modal-title').textContent = 'Create Savings Goal';
      document.getElementById('goal-id').value = '';
      UIService.openModal('modal-goal');
    });
  }

  const btnSetBudget = document.getElementById('btn-set-budget');
  if (btnSetBudget) {
    btnSetBudget.addEventListener('click', () => {
      const form = document.getElementById('budget-form');
      if (form) form.reset();
      UIService.openModal('modal-budget');
    });
  }

  // Export CSV
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      try {
        StorageService.exportTransactionsToCSV(AppState.transactions);
        UIService.showToast('Transaction history exported as CSV', 'success');
      } catch (err) {
        UIService.showToast(err.message, 'error');
      }
    });
  }

  // Import CSV
  const btnImportTrigger = document.getElementById('btn-import-csv-trigger');
  const fileInput = document.getElementById('csv-file-input');
  if (btnImportTrigger && fileInput) {
    btnImportTrigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleCSVFileSelected);
  }

  // Date Range Filters
  document.querySelectorAll('.date-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const period = pill.getAttribute('data-period');
      AppState.filters.datePeriod = period;

      const customInputs = document.getElementById('custom-range-controls');
      if (period === 'custom') {
        if (customInputs) customInputs.classList.add('active');
      } else {
        if (customInputs) customInputs.classList.remove('active');
        AppState.filters.customStart = null;
        AppState.filters.customEnd = null;
        loadDataAndRender();
      }
    });
  });

  const customStart = document.getElementById('custom-date-start');
  const customEnd = document.getElementById('custom-date-end');
  const applyCustom = () => {
    if (AppState.filters.datePeriod === 'custom') {
      AppState.filters.customStart = customStart.value;
      AppState.filters.customEnd = customEnd.value;
      loadDataAndRender();
    }
  };
  if (customStart) customStart.addEventListener('change', applyCustom);
  if (customEnd) customEnd.addEventListener('change', applyCustom);

  // Type Toggle Buttons in Form
  const btnTypeExpense = document.getElementById('btn-type-expense');
  const btnTypeIncome = document.getElementById('btn-type-income');
  if (btnTypeExpense) btnTypeExpense.addEventListener('click', () => setTransactionFormType('expense'));
  if (btnTypeIncome) btnTypeIncome.addEventListener('click', () => setTransactionFormType('income'));

  // Transaction Form Submit
  const txForm = document.getElementById('transaction-form');
  if (txForm) {
    txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('tx-id').value;
      const title = document.getElementById('tx-title').value;
      const amount = document.getElementById('tx-amount').value;
      const type = document.getElementById('tx-type').value;
      const category = document.getElementById('tx-category-select').value;
      const date = document.getElementById('tx-date').value;
      const note = document.getElementById('tx-note').value;

      try {
        if (id) {
          TransactionsService.updateTransaction(id, { title, amount, type, category, date, note });
          UIService.showToast('Transaction updated successfully', 'success');
        } else {
          TransactionsService.addTransaction({ title, amount, type, category, date, note });
          UIService.showToast('Transaction added successfully', 'success');
        }
        UIService.closeModal('modal-transaction');
        loadDataAndRender();
      } catch (err) {
        UIService.showToast(err.message, 'error');
      }
    });
  }

  // Delete Confirmation Confirm Button
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-tx');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      if (AppState.transactionToDeleteId) {
        TransactionsService.deleteTransaction(AppState.transactionToDeleteId);
        AppState.transactionToDeleteId = null;
        UIService.closeModal('modal-delete-confirm');
        UIService.showToast('Transaction deleted successfully', 'info');
        loadDataAndRender();
      }
    });
  }

  // Savings Goal Form Submit
  const goalForm = document.getElementById('goal-form');
  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('goal-id').value;
      const title = document.getElementById('goal-title').value;
      const targetAmount = document.getElementById('goal-target-amount').value;
      const currentAmount = document.getElementById('goal-current-amount').value;
      const targetDate = document.getElementById('goal-date').value;
      const category = document.getElementById('goal-category').value;

      if (!title || !targetAmount) {
        UIService.showToast('Please provide a goal title and target amount', 'warning');
        return;
      }

      if (id) {
        GoalsService.updateGoal(id, { title, targetAmount, currentAmount, targetDate, category });
        UIService.showToast('Savings goal updated', 'success');
      } else {
        GoalsService.addGoal({ title, targetAmount, currentAmount, targetDate, category });
        UIService.showToast('New savings goal created!', 'success');
      }

      UIService.closeModal('modal-goal');
      loadDataAndRender();
    });
  }

  // Fund Goal Form Submit
  const fundGoalForm = document.getElementById('fund-goal-form');
  if (fundGoalForm) {
    fundGoalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('fund-goal-amount');
      const deposit = parseFloat(amountInput.value);

      if (!deposit || deposit <= 0) {
        UIService.showToast('Please enter a valid deposit amount', 'warning');
        return;
      }

      const { goal, justCompleted } = GoalsService.addFunds(AppState.goalToFundId, deposit);
      if (goal) {
        UIService.closeModal('modal-fund-goal');
        amountInput.value = '';

        if (justCompleted) {
          GoalsService.triggerConfetti();
          UIService.showToast(`🎉 Congratulations! You achieved your "${goal.title}" goal!`, 'success', 6000);
        } else {
          UIService.showToast(`Deposited ${formatRupee(deposit)} to "${goal.title}"`, 'success');
        }

        loadDataAndRender();
      }
    });
  }

  // Budget Form Submit
  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('budget-category-select').value;
      const amount = document.getElementById('budget-amount-input').value;

      BudgetsService.setBudget(category, amount);
      UIService.closeModal('modal-budget');
      UIService.showToast(`Budget for ${category} updated to ${formatRupee(amount)}`, 'success');
      loadDataAndRender();
    });
  }

  // Search and Filters in Transactions List
  const searchInput = document.getElementById('tx-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.filters.search = e.target.value;
      renderTransactions();
    });
  }

  const filterType = document.getElementById('filter-type');
  if (filterType) {
    filterType.addEventListener('change', (e) => {
      AppState.filters.type = e.target.value;
      renderTransactions();
    });
  }

  const filterCat = document.getElementById('filter-category');
  if (filterCat) {
    filterCat.addEventListener('change', (e) => {
      AppState.filters.category = e.target.value;
      renderTransactions();
    });
  }

  const sortBy = document.getElementById('sort-by');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      AppState.filters.sortBy = e.target.value;
      renderTransactions();
    });
  }

  // Completed Goals Accordion Toggle
  const completedToggle = document.getElementById('completed-goals-toggle-btn');
  if (completedToggle) {
    completedToggle.addEventListener('click', () => {
      const list = document.getElementById('completed-goals-list');
      if (list) {
        list.classList.toggle('active');
        const isNowActive = list.classList.contains('active');
        completedToggle.querySelector('.arrow-icon').style.transform = isNowActive ? 'rotate(90deg)' : 'rotate(0deg)';
      }
    });
  }
}

// CSV File Selected Handler
function handleCSVFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const csvText = event.target.result;
      const parsedRecords = StorageService.parseCSV(csvText);

      // Confirm with user
      if (confirm(`Parsed ${parsedRecords.length} transactions from "${file.name}". Merge into your existing records?`)) {
        const current = TransactionsService.getTransactions();
        const merged = [...parsedRecords, ...current];
        StorageService.saveTransactions(merged);
        UIService.showToast(`Successfully imported ${parsedRecords.length} transactions!`, 'success');
        loadDataAndRender();
      }
    } catch (err) {
      UIService.showToast(`CSV Import Error: ${err.message}`, 'error', 5000);
    } finally {
      e.target.value = ''; // Reset input
    }
  };
  reader.readAsText(file);
}
