import { Player } from '../types';

const STORAGE_KEY = 'shut-the-box:scores';

export interface StoredScoresSnapshot {
  players: Array<Pick<Player, 'id' | 'name' | 'totalScore' | 'lastScore'>>;
  round: number;
  unfinishedCounts?: Record<string, number>;
  updatedAt: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadScoresSnapshot(): StoredScoresSnapshot | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredScoresSnapshot;
    if (!parsed.players || !Array.isArray(parsed.players)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('[shut-the-box] Failed to load stored scores', error);
    return null;
  }
}

export function saveScoresSnapshot(
  players: Player[],
  round: number,
  unfinishedCounts: Record<string, number>
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const snapshot: StoredScoresSnapshot = {
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        totalScore: player.totalScore,
        lastScore: player.lastScore
      })),
      round,
      unfinishedCounts,
      updatedAt: Date.now()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[shut-the-box] Failed to save scores', error);
  }
}

export function clearStoredScores(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[shut-the-box] Failed to clear stored scores', error);
  }
}
