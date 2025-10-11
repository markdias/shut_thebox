export type OneDieRule = 'after789' | 'totalUnder6' | 'never';
export type ScoringMode = 'lowest' | 'target' | 'instant';

export interface GameOptions {
  maxTile: 9 | 10 | 12;
  oneDieRule: OneDieRule;
  scoring: ScoringMode;
  targetScore: number;
  instantWinOnShut: boolean;
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  lastScore: number | null;
  hintsEnabled: boolean;
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
