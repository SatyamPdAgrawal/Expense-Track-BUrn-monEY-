/**
 * BUrn monEY — Chart.js Visualizations Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Handles doughnut, pie, and bar/line charts with proper lifecycle cleanup,
 * theme reactivity, and empty state management.
 */

import { formatRupee, calculateCategoryExpenses, calculateMonthlyTrend } from './calculations.js';

// Chart instances store to guarantee no duplicate charts
const chartInstances = {
  incomeVsExpense: null,
  categorySpending: null,
  monthlyTrend: null
};

// Color palettes for dark and light modes
const PALETTES = {
  income: '#10b981',       // Emerald green
  expense: '#f43f5e',      // Rose flame
  accent: '#f97316',       // Vibrant orange
  categories: [
    '#f97316', '#3b82f6', '#10b981', '#8b5cf6',
    '#ec4899', '#06b6d4', '#eab308', '#a855f7',
    '#14b8a6', '#6366f1', '#64748b'
  ]
};

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    textColor: isDark ? '#94a3b8' : '#475569',
    headingColor: isDark ? '#f8fafc' : '#0f172a',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
  };
}

export const ChartsService = {
  // Safe destruction of specific or all charts
  destroyChart(key) {
    if (chartInstances[key]) {
      try {
        chartInstances[key].destroy();
      } catch (e) {
        console.warn(`[BUrn monEY Charts] Error destroying chart ${key}:`, e);
      }
      chartInstances[key] = null;
    }
  },

  destroyAll() {
    Object.keys(chartInstances).forEach(key => this.destroyChart(key));
  },

  /**
   * Chart 1: Income vs Expense (Doughnut)
   */
  renderIncomeVsExpenseChart(canvasId, totalIncome, totalExpense) {
    this.destroyChart('incomeVsExpense');
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const hasData = totalIncome > 0 || totalExpense > 0;

    const container = canvas.parentElement;
    const emptyNotice = container.querySelector('.chart-empty-notice');

    if (!hasData) {
      if (emptyNotice) emptyNotice.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    canvas.style.display = 'block';

    chartInstances.incomeVsExpense = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{
          data: [totalIncome, totalExpense],
          backgroundColor: [PALETTES.income, PALETTES.expense],
          borderColor: theme.cardBg,
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.parsed || 0;
                const total = totalIncome + totalExpense;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${label}: ${formatRupee(val)} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        }
      }
    });
  },

  /**
   * Chart 2: Category Spending (Doughnut / Pie)
   */
  renderCategorySpendingChart(canvasId, transactions) {
    this.destroyChart('categorySpending');
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const catMap = calculateCategoryExpenses(transactions);
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const totalSpent = data.reduce((a, b) => a + b, 0);

    const container = canvas.parentElement;
    const emptyNotice = container.querySelector('.chart-empty-notice');

    if (totalSpent === 0 || labels.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    canvas.style.display = 'block';

    chartInstances.categorySpending = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: PALETTES.categories.slice(0, labels.length),
          borderColor: theme.cardBg,
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.parsed || 0;
                const pct = totalSpent > 0 ? ((val / totalSpent) * 100).toFixed(1) : 0;
                return ` ${label}: ${formatRupee(val)} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        }
      }
    });
  },

  /**
   * Chart 3: Monthly Trend (Line / Bar chart for past 6 months)
   */
  renderMonthlyTrendChart(canvasId, transactions) {
    this.destroyChart('monthlyTrend');
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const months = calculateMonthlyTrend(transactions, 6);

    const labels = months.map(m => m.label);
    const incomeData = months.map(m => m.income);
    const expenseData = months.map(m => m.expense);

    const hasAnyActivity = incomeData.some(v => v > 0) || expenseData.some(v => v > 0);

    const container = canvas.parentElement;
    const emptyNotice = container.querySelector('.chart-empty-notice');

    if (!hasAnyActivity) {
      if (emptyNotice) emptyNotice.style.display = 'flex';
      canvas.style.display = 'none';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    canvas.style.display = 'block';

    chartInstances.monthlyTrend = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderColor: '#f43f5e',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: { color: theme.gridColor, drawBorder: false },
            ticks: {
              color: theme.textColor,
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          },
          y: {
            grid: { color: theme.gridColor, drawBorder: false },
            ticks: {
              color: theme.textColor,
              font: { family: "'Inter', sans-serif", size: 11 },
              callback: (val) => formatRupee(val, { compact: true })
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: theme.textColor,
              font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y || 0;
                return ` ${label}: ${formatRupee(val)}`;
              }
            }
          }
        },
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        }
      }
    });
  }
};
