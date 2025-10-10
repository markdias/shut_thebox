import { GameOptions } from '../types';

export function createInitialTiles(maxTile: number): number[] {
  return Array.from({ length: maxTile }, (_, index) => index + 1);
}

export function sumTiles(tiles: number[]): number {
  return tiles.reduce((total, value) => total + value, 0);
}

export function canUseOneDie(openTiles: number[], options: GameOptions): boolean {
  if (options.oneDieRule === 'never') {
    return false;
  }

  const maxTile = options.maxTile;
  const highTiles = [maxTile - 2, maxTile - 1, maxTile];
  const openSet = new Set(openTiles);

  if (options.oneDieRule === 'after789') {
    return highTiles.every((tile) => !openSet.has(tile));
  }

  if (options.oneDieRule === 'totalUnder6') {
    return sumTiles(openTiles) < 6;
  }

  return false;
}
