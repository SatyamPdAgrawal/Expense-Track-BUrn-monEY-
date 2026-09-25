/**
 * BUrn monEY — Smart Insights Engine
 * Brand: BUrn monEY ("See where your money goes.")
 * Pure rule-based analytical engine that derives actionable intelligence from user transactions,
 * budgets, and savings goals.
 *
 * Architecture Note:
 * This module is architected with a decoupled `generateInsights()` interface. When a future backend
 * AI service (LLM proxy) is configured, this module can seamlessly switch to or augment rule-based
 * heuristics with remote AI insights without exposing secrets or breaking the UI contract.
 */

import { formatRupee, calculateSavingsRate, calculateCategoryExpenses } from './calculations.js';

export const SmartInsightsEngine = {
  /**
   * Generates actionable heuristics-based financial insights.
   * @param {Object} context
   * @param {Array} context.transactions - List of transactions
   * @param {Object} context.budgets - Category budget limits
   * @param {Array} context.goals - User savings goals
   * @returns {Array<Object>} List of structured insight cards
   */
  generateInsights({ transactions = [], budgets = {}, goals = [] } = {}) {
    const insights = [];

    if (!transactions || transactions.length === 0) {
      return [
        {
          id: 'insight_welcome',
          type: 'info',
          icon: 'sparkles',
          title: 'Welcome to BUrn monEY',
          message: 'Add your initial income and expense transactions to reveal intelligent spending patterns and category breakdowns.',
          metric: 'Ready to track'
        }
      ];
    }

    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');
    const totalExp = expenses.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalInc = incomes.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const savingsRate = calculateSavingsRate(totalInc, totalExp);
    const catExpenses = calculateCategoryExpenses(transactions);

    // 1. Highest Spending Category & Spending Concentration
    const sortedCategories = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const concentration = totalExp > 0 ? Math.round((topAmount / totalExp) * 100) : 0;

      insights.push({
        id: 'insight_top_category',
        type: concentration > 45 ? 'warning' : 'primary',
        icon: 'trending-up',
        title: 'Spending Concentration',
        message: `${topCategory} is your largest expense category at ${formatRupee(topAmount)}, representing ${concentration}% of your total outflow.`,
        metric: `${concentration}% outflow`
      });
    }

    // 2. Largest Single Transaction
    if (expenses.length > 0) {
      const largestTx = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
      insights.push({
        id: 'insight_largest_tx',
        type: 'info',
        icon: 'tag',
        title: 'Largest Single Expense',
        message: `Your peak single expense was "${largestTx.title}" at ${formatRupee(largestTx.amount)} (${largestTx.category}) on ${largestTx.date}.`,
        metric: formatRupee(largestTx.amount)
      });
    }

    // 3. Savings Rate Evaluation
    if (totalInc > 0) {
      if (savingsRate >= 30) {
        insights.push({
          id: 'insight_savings_great',
          type: 'success',
          icon: 'shield-check',
          title: 'Superior Savings Discipline',
          message: `Your current savings rate is ${savingsRate}%. Maintaining over 30% puts you in an elite tier for compounding wealth.`,
          metric: `${savingsRate}% saved`
        });
      } else if (savingsRate > 0) {
        insights.push({
          id: 'insight_savings_moderate',
          type: 'info',
          icon: 'piggy-bank',
          title: 'Steady Accumulation',
          message: `You are saving ${savingsRate}% of your total earnings. Trimming discretionary dining or subscriptions could push this past 25%.`,
          metric: `${savingsRate}% saved`
        });
      } else {
        insights.push({
          id: 'insight_savings_deficit',
          type: 'warning',
          icon: 'alert-triangle',
          title: 'Spending Exceeds Earnings',
          message: `Outflow exceeds tracked income by ${formatRupee(Math.abs(totalInc - totalExp))}. Review essential vs discretionary expenses.`,
          metric: 'Deficit'
        });
      }
    }

    // 4. Budget Status & Warning Thresholds
    let budgetOverLimitFound = false;
    for (const [cat, limit] of Object.entries(budgets)) {
      const spent = catExpenses[cat] || 0;
      if (limit > 0 && spent > limit) {
        const overage = spent - limit;
        insights.push({
          id: `insight_budget_exceeded_${cat}`,
          type: 'warning',
          icon: 'alert-circle',
          title: `Budget Exceeded: ${cat}`,
          message: `You have spent ${formatRupee(spent)} on ${cat}, exceeding your ${formatRupee(limit)} cap by ${formatRupee(overage)}.`,
          metric: `Over by ${formatRupee(overage)}`
        });
        budgetOverLimitFound = true;
        break; // Only show one top budget warning to keep insights clean
      }
    }

    if (!budgetOverLimitFound) {
      // Check for approaching limits (70% - 90%)
      for (const [cat, limit] of Object.entries(budgets)) {
        const spent = catExpenses[cat] || 0;
        const ratio = (spent / limit) * 100;
        if (limit > 0 && ratio >= 75 && ratio <= 100) {
          insights.push({
            id: `insight_budget_near_${cat}`,
            type: 'warning',
            icon: 'clock',
            title: `Approaching Budget: ${cat}`,
            message: `You have utilized ${Math.round(ratio)}% of your ${cat} budget (${formatRupee(spent)} / ${formatRupee(limit)}). Only ${formatRupee(limit - spent)} remaining.`,
            metric: `${Math.round(ratio)}% used`
          });
          break;
        }
      }
    }

    // 5. Savings Goals Progress
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length > 0) {
      // Find goal with highest progress
      const closestGoal = [...activeGoals].sort((a, b) => {
        const pA = (a.currentAmount / a.targetAmount);
        const pB = (b.currentAmount / b.targetAmount);
        return pB - pA;
      })[0];

      const pct = Math.min(100, Math.round((closestGoal.currentAmount / closestGoal.targetAmount) * 100));
      insights.push({
        id: 'insight_goal_progress',
        type: 'success',
        icon: 'target',
        title: 'Goal Milestones',
        message: `"${closestGoal.title}" is ${pct}% funded (${formatRupee(closestGoal.currentAmount)} of ${formatRupee(closestGoal.targetAmount)}). Keep up the momentum!`,
        metric: `${pct}% complete`
      });
    }

    return insights;
  },

  /**
   * Future-proof entry point: Can query a backend AI proxy if configured,
   * or fall back cleanly to local rule-based generation.
   */
  async getInsightsAsync(context, remoteApiConfig = null) {
    if (remoteApiConfig && remoteApiConfig.endpoint) {
      try {
        const response = await fetch(remoteApiConfig.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: context.transactions,
            budgets: context.budgets,
            goals: context.goals
          })
        });
        if (response.ok) {
          const aiData = await response.json();
          if (Array.isArray(aiData.insights) && aiData.insights.length > 0) {
            return aiData.insights;
          }
        }
      } catch (err) {
        console.warn('[BUrn monEY Insights] Remote AI proxy unavailable, using local rules:', err);
      }
    }

    // Default to local deterministic intelligence
    return this.generateInsights(context);
  }
};
