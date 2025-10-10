export type OneDieRule = 'after789' | 'totalUnder6' | 'never';

export interface GameOptions {
  maxTile: 12;
  oneDieRule: OneDieRule;
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  lastScore: number | null;
}

export interface TurnHistoryEntry {
  dice: number[];
  closedTiles: number[];
}

export interface TurnState {
  playerIndex: number;
  dice: number[];
  rolled: boolean;
  selectableCombos: number[][];
  selectedTiles: number[];
  history: TurnHistoryEntry[];
  canRollOneDie: boolean;
  finished: boolean;
}

export type GamePhase = 'setup' | 'inProgress' | 'finished';
