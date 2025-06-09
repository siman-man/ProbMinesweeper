// Minesweeper probability solver in JavaScript
// Calculates probability of bomb in each cell based on current board state

function computeProbabilities(board, totalBombs) {
  const H = board.length;
  const W = board[0].length;

  // treat flags as unknown cells so user marks do not affect solving
  board = board.map(row => row.map(c => (c === 'F' ? '?' : c)));

  // parse board
  const numbers = [];
  const frontierMap = Array.from({ length: H }, () => Array(W).fill(-1));
  const frontier = [];
  let unknownCount = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (board[y][x] === '?') {
        unknownCount++;
      }
    }
  }

  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  function inBounds(y, x) {
    return y >= 0 && x >= 0 && y < H && x < W;
  }

  // gather opened cells and build frontier
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = board[y][x];
      if (c === '?') continue;
      const num = c === '.' ? 0 : parseInt(c, 10);
      const cell = { y, x, num, unknowns: [] };
      for (const [dy, dx] of dirs) {
        const ny = y + dy, nx = x + dx;
        if (!inBounds(ny, nx)) continue;
        const nc = board[ny][nx];
        if (nc === '?') {
          if (frontierMap[ny][nx] === -1) {
            frontierMap[ny][nx] = frontier.length;
            frontier.push({ y: ny, x: nx });
          }
          cell.unknowns.push(frontierMap[ny][nx]);
        }
      }
      numbers.push(cell);
    }
  }

  const outsideCount = unknownCount - frontier.length;
  const bombsLeft = totalBombs;

  // Precompute combination numbers using Pascal's triangle
  const comb = Array.from({ length: 100 }, () => Array(100).fill(0));
  for (let n = 0; n < 100; n++) {
    comb[n][0] = comb[n][n] = 1;
    for (let k = 1; k < n; k++) {
      comb[n][k] = comb[n-1][k-1] + comb[n-1][k];
    }
  }
  function C(n, k) {
    if (k < 0 || k > n) return 0;
    if (n < comb.length) return comb[n][k];
    // fallback slow calculation
    let res = 1;
    for (let i = 1; i <= k; i++) res = res * (n - i + 1) / i;
    return res;
  }

  const state = Array(frontier.length).fill(0);
  const counts = Array(frontier.length).fill(0);
  let totalWeight = 0;
  let outsideProbSum = 0;

  // data for each number cell: remaining bombs and unknowns
  const remaining = numbers.map(c => ({ bombs: c.num, unk: c.unknowns.length }));

  function dfs(idx, usedBombs) {
    if (idx === frontier.length) {
      for (const r of remaining) {
        if (r.bombs !== 0) return; // constraint not satisfied
      }
      const left = bombsLeft - usedBombs;
      if (left < 0 || left > outsideCount) return;
      const weight = C(outsideCount, left);
      totalWeight += weight;
      for (let i = 0; i < frontier.length; i++) {
        if (state[i]) counts[i] += weight;
      }
      if (outsideCount > 0) {
        outsideProbSum += weight * (left / outsideCount);
      }
      return;
    }
    // choose 0 or 1 for this frontier cell
    // update constraints for neighboring number cells
    const related = [];
    for (let i = 0; i < numbers.length; i++) {
      const idxs = numbers[i].unknowns;
      if (idxs.includes(idx)) related.push(i);
    }

    // try without bomb
    for (const r of related) remaining[r].unk--;
    let valid = true;
    for (const r of related) {
      const rem = remaining[r];
      if (rem.bombs < 0 || rem.bombs > rem.unk) valid = false;
    }
    if (valid) {
      state[idx] = 0;
      dfs(idx + 1, usedBombs);
    }
    for (const r of related) remaining[r].unk++;

    // try with bomb
    for (const r of related) { remaining[r].unk--; remaining[r].bombs--; }
    valid = true;
    for (const r of related) {
      const rem = remaining[r];
      if (rem.bombs < 0 || rem.bombs > rem.unk) valid = false;
    }
    if (valid) {
      state[idx] = 1;
      dfs(idx + 1, usedBombs + 1);
    }
    for (const r of related) { remaining[r].unk++; remaining[r].bombs++; }
  }

  dfs(0, 0);

  const probs = Array.from({ length: H }, () => Array(W).fill(null));

  if (totalWeight === 0) {
    // no valid configurations
    return probs;
  }

  for (let i = 0; i < frontier.length; i++) {
    const { y, x } = frontier[i];
    probs[y][x] = counts[i] / totalWeight;
  }
  if (outsideCount > 0) {
    const outsideProb = outsideProbSum / totalWeight;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (board[y][x] === '?') {
          if (frontierMap[y][x] === -1) {
            probs[y][x] = outsideProb;
          }
        }
      }
    }
  }

  return probs;
}

// export to browser global
if (typeof window !== 'undefined') {
  window.computeProbabilities = computeProbabilities;
}
