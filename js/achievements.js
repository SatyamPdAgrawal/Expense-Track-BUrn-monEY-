/**
 * BUrn monEY — Gamification & Achievements Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Tracks financial milestones, unlocks badges, and safely persists progress.
 */

import { StorageService } from './storage.js';
import { calculateBalance } from './calculations.js';

const BADGE_DEFINITIONS = [
  {
    id: 'first_tx',
    title: 'First Step',
    description: 'Logged your very first transaction in BUrn monEY.',
    icon: 'flame',
    color: '#f97316'
  },
  {
    id: 'tx_10',
    title: '10 Transactions',
    description: 'Logged 10 financial transactions.',
    icon: 'list-checks',
    color: '#3b82f6'
  },
  {
    id: 'tx_50',
    title: '50 Transactions',
    description: 'Milestone reached: 50 logged transactions.',
    icon: 'activity',
    color: '#8b5cf6'
  },
  {
    id: 'tx_100',
    title: '100 Transactions',
    description: 'Master tracker: 100 logged transactions.',
    icon: 'award',
    color: '#eab308'
  },
  {
    id: 'first_goal',
    title: 'First Goal Smashed',
    description: 'Successfully reached 100% on a savings goal.',
    icon: 'target',
    color: '#10b981'
  },
  {
    id: 'goal_master',
    title: 'Goal Master',
    description: 'Completed 3 or more distinct savings goals.',
    icon: 'trophy',
    color: '#ec4899'
  },
  {
    id: 'saved_10k',
    title: '₹10,000 Saved',
    description: 'Maintained total net savings greater than ₹10,000.',
    icon: 'shield-check',
    color: '#14b8a6'
  },
  {
    id: 'days_10',
    title: '10 Days Tracking',
    description: 'Logged transactions across at least 10 different calendar days.',
    icon: 'calendar',
    color: '#6366f1'
  }
];

export const AchievementsService = {
  getAchievements() {
    const stored = StorageService.loadAchievements();
    return BADGE_DEFINITIONS.map(def => {
      const state = stored[def.id] || {};
      return {
        ...def,
        unlocked: Boolean(state.unlocked),
        unlockedAt: state.unlockedAt || null
      };
    });
  },

  /**
   * Evaluates criteria and returns newly unlocked achievements (for toasts/celebrations).
   */
  checkAchievements({ transactions = [], goals = [] } = {}) {
    const stored = StorageService.loadAchievements();
    const newlyUnlocked = [];

    const totalTxCount = transactions.length;
    const completedGoalsCount = goals.filter(g => g.isCompleted).length;
    const balance = calculateBalance(transactions);

    // Count distinct dates
    const distinctDates = new Set(transactions.map(t => t.date).filter(Boolean));

    const checkAndUnlock = (id, condition) => {
      if (condition && (!stored[id] || !stored[id].unlocked)) {
        const now = new Date().toISOString();
        stored[id] = { unlocked: true, unlockedAt: now };
        const def = BADGE_DEFINITIONS.find(b => b.id === id);
        if (def) {
          newlyUnlocked.push({ ...def, unlocked: true, unlockedAt: now });
        }
      }
    };

    // 1. First Step
    checkAndUnlock('first_tx', totalTxCount >= 1);

    // 2. 10 Transactions
    checkAndUnlock('tx_10', totalTxCount >= 10);

    // 3. 50 Transactions
    checkAndUnlock('tx_50', totalTxCount >= 50);

    // 4. 100 Transactions
    checkAndUnlock('tx_100', totalTxCount >= 100);

    // 5. First Goal
    checkAndUnlock('first_goal', completedGoalsCount >= 1);

    // 6. Goal Master
    checkAndUnlock('goal_master', completedGoalsCount >= 3);

    // 7. ₹10,000 Saved
    checkAndUnlock('saved_10k', balance >= 10000);

    // 8. 10 Days Tracking
    checkAndUnlock('days_10', distinctDates.size >= 10);

    if (newlyUnlocked.length > 0) {
      StorageService.saveAchievements(stored);
    }

    return newlyUnlocked;
  }
};
