export type OneDieRule = 'after789' | 'totalUnder6' | 'never';
export type ScoringMode = 'lowest' | 'target' | 'instant';
export type ThemeName = 'neon' | 'matrix' | 'classic';

export interface GameOptions {
  maxTile: number;
  oneDieRule: OneDieRule;
  scoring: ScoringMode;
  targetScore: number;
  instantWinOnShut: boolean;
  theme: ThemeName;
  cheatFullWin?: boolean;
  cheatAutoPlay?: boolean;
  autoRetryOnFail?: boolean;
  showHeaderDetails?: boolean;
  showCodeTools?: boolean;
  requireMoveConfirmation?: boolean;
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
