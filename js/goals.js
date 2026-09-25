/**
 * BUrn monEY — Savings Goals Module
 * Brand: BUrn monEY ("See where your money goes.")
 * Handles multiple savings goals, real-time progress calculations, animated progress bars,
 * deposit/add-funds actions, goal completion lifecycle, and controlled one-time confetti celebration.
 */

import { StorageService } from './storage.js';
import { formatRupee } from './calculations.js';

export const GoalsService = {
  getGoals() {
    return StorageService.loadGoals();
  },

  addGoal({ title, targetAmount, currentAmount = 0, targetDate = '', category = 'Savings' }) {
    const goals = this.getGoals();
    const target = Math.max(1, parseFloat(targetAmount) || 0);
    const current = Math.max(0, parseFloat(currentAmount) || 0);
    const isCompleted = current >= target;

    const newGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: targetDate || '',
      category: category || 'Savings',
      isCompleted: isCompleted,
      completedAt: isCompleted ? new Date().toISOString().split('T')[0] : null,
      celebrated: false // Flag to ensure confetti triggers once only
    };

    goals.unshift(newGoal);
    StorageService.saveGoals(goals);
    return newGoal;
  },

  updateGoal(id, updates) {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;

    const current = goals[index];
    const target = updates.targetAmount !== undefined ? Math.max(1, parseFloat(updates.targetAmount) || 1) : current.targetAmount;
    const currentAmt = updates.currentAmount !== undefined ? Math.max(0, parseFloat(updates.currentAmount) || 0) : current.currentAmount;
    const isCompleted = currentAmt >= target;

    const updated = {
      ...current,
      ...updates,
      targetAmount: target,
      currentAmount: currentAmt,
      isCompleted: isCompleted,
      completedAt: isCompleted ? (current.completedAt || new Date().toISOString().split('T')[0]) : null
    };

    goals[index] = updated;
    StorageService.saveGoals(goals);
    return updated;
  },

  addFunds(id, depositAmount) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return { goal: null, justCompleted: false };

    const deposit = Math.max(0, parseFloat(depositAmount) || 0);
    if (deposit <= 0) return { goal, justCompleted: false };

    const wasCompleted = goal.isCompleted;
    goal.currentAmount = (parseFloat(goal.currentAmount) || 0) + deposit;

    let justCompleted = false;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
      if (!goal.completedAt) {
        goal.completedAt = new Date().toISOString().split('T')[0];
      }
      if (!wasCompleted && !goal.celebrated) {
        justCompleted = true;
        goal.celebrated = true; // Mark celebrated so it never triggers on page reload
      }
    }

    StorageService.saveGoals(goals);
    return { goal, justCompleted };
  },

  deleteGoal(id) {
    let goals = this.getGoals();
    goals = goals.filter(g => g.id !== id);
    StorageService.saveGoals(goals);
    return true;
  },

  markCelebrated(id) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
      goal.celebrated = true;
      StorageService.saveGoals(goals);
    }
  },

  /**
   * Fires a one-time confetti blast using Canvas Confetti.
   */
  triggerConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#10b981', '#3b82f6', '#ec4899', '#eab308']
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }
};
