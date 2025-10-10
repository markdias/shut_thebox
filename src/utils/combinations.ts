export function generateTileCombos(tiles: number[], target: number): number[][] {
  const results: number[][] = [];
  const sorted = [...tiles].sort((a, b) => a - b);

  function backtrack(start: number, sum: number, path: number[]) {
    if (sum === target) {
      results.push([...path]);
      return;
    }

    for (let i = start; i < sorted.length; i += 1) {
      const tile = sorted[i];
      const nextSum = sum + tile;
      if (nextSum > target) {
        continue;
      }
      path.push(tile);
      backtrack(i + 1, nextSum, path);
      path.pop();
    }
  }

  backtrack(0, 0, []);
  return results;
}

export function isSameCombo(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
}
