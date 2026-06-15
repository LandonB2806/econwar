/**
 * Political Capital ledger helpers. PC is the second currency: earned per
 * department per phase, spent on abilities and to weight votes. Pure integer
 * arithmetic; settlePhase folds earn/spend into each PlayerSettlement, but
 * these helpers are useful to the FSM for validation and previews.
 */
import { getDepartment } from "@econwar/shared";
import type { DepartmentId, PhaseType } from "@econwar/shared";

/** PC a department earns at the end of a given phase. */
export function pcEarned(department: DepartmentId, phase: PhaseType): number {
  return getDepartment(department).pcRate[phase];
}

/** Resulting PC after earning then spending. Never returns below zero. */
export function applyPcDelta(
  current: number,
  earned: number,
  spent: number,
): number {
  return Math.max(0, current + earned - spent);
}

/** Whether a player can afford a PC cost. */
export function canAfford(current: number, cost: number): boolean {
  return current >= cost;
}
