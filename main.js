let WIDTH = 9;
let HEIGHT = 9;
let bombs = 10;

let firstMove = true;

let bombBoard = [];
let numbers = [];
let visible = [];
let gameOver = false;
let explodedCell = null; // 爆発したセルの座標
let autoOpenInProgress = false; // 自動オープン中かどうか
let winMessageShown = false; // 勝利メッセージが表示済みかどうか

function updateInfo() {
  const info = document.getElementById('info');
  if (info) {
    info.textContent = `${WIDTH} x ${HEIGHT} - ${bombs} bombs`;
  }
}

function initGame() {
  const input = document.getElementById('bomb-count');
  if (input) {
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val > 0) bombs = val;
  }
  const wInput = document.getElementById('width-input');
  if (wInput) {
    const val = parseInt(wInput.value, 10);
    if (!isNaN(val) && val > 0 && val <= 15) WIDTH = val;
  }
  const hInput = document.getElementById('height-input');
  if (hInput) {
    const val = parseInt(hInput.value, 10);
    if (!isNaN(val) && val > 0 && val <= 15) HEIGHT = val;
  }
  bombBoard = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  numbers = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
  visible = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('?'));
  gameOver = false;
  firstMove = true;
  explodedCell = null;
  autoOpenInProgress = false;
  winMessageShown = false;
  updateInfo();
  buildBoard();
  updateDisplay();
}

function computeNumbers() {
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (bombBoard[y][x]) continue;
      let count = 0;
      for (const [dy, dx] of dirs) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && nx >= 0 && ny < HEIGHT && nx < WIDTH && bombBoard[ny][nx]) {
          count++;
        }
      }
      numbers[y][x] = count;
    }
  }
}

function placeBombsSafe(sy, sx) {
  let placed = 0;
  while (placed < bombs) {
    const y = Math.floor(Math.random() * HEIGHT);
    const x = Math.floor(Math.random() * WIDTH);
    if (!bombBoard[y][x] && !(y === sy && x === sx)) {
      bombBoard[y][x] = true;
      placed++;
    }
  }
  computeNumbers();
}

function buildBoard() {
  const table = document.getElementById('board');
  table.innerHTML = '';
  for (let y = 0; y < HEIGHT; y++) {
    const tr = document.createElement('tr');
    for (let x = 0; x < WIDTH; x++) {
      const td = document.createElement('td');
      td.dataset.y = y;
      td.dataset.x = x;
      td.addEventListener('click', handleLeft);
      td.addEventListener('contextmenu', handleRight);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

function handleLeft(e) {
  if (gameOver) return;
  const y = parseInt(this.dataset.y);
  const x = parseInt(this.dataset.x);
  openCell(y, x);
}

function handleRight(e) {
  e.preventDefault();
  if (gameOver) return;
  const y = parseInt(this.dataset.y);
  const x = parseInt(this.dataset.x);
  toggleFlag(y, x);
}

function openCell(y, x) {
  if (visible[y][x] !== '?') return;
  if (firstMove) {
    placeBombsSafe(y, x);
    firstMove = false;
  }
  if (bombBoard[y][x]) {
    visible[y][x] = '💣';
    explodedCell = { y, x }; // 爆発したセルを記録
    gameOver = true;
    revealAll();
    setTimeout(() => showGameMessage('ゲームオーバー💣', 'lose'), 500);
    return;
  }
  floodFill(y, x);
  checkWin();
}

function floodFill(y, x) {
  const stack = [[y, x]];
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  while (stack.length) {
    const [cy, cx] = stack.pop();
    if (cy < 0 || cx < 0 || cy >= HEIGHT || cx >= WIDTH) continue;
    if (visible[cy][cx] !== '?') continue;
    const num = numbers[cy][cx];
    visible[cy][cx] = num === 0 ? '.' : String(num);
    if (num === 0) {
      for (const [dy, dx] of dirs) {
        stack.push([cy + dy, cx + dx]);
      }
    }
  }
}

function toggleFlag(y, x) {
  if (visible[y][x] === '?') {
    visible[y][x] = 'F';
  } else if (visible[y][x] === 'F') {
    visible[y][x] = '?';
  }
  checkWin();
}

function revealAll() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (bombBoard[y][x]) {
        if (visible[y][x] !== '💣') visible[y][x] = '💣';
      } else if (visible[y][x] === '?') {
        const n = numbers[y][x];
        visible[y][x] = n === 0 ? '.' : String(n);
      }
    }
  }
  updateDisplay();
}

function checkWin() {
  // 爆弾マス以外のすべてのマスが開かれているかチェック
  let openedSafeCells = 0;
  
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // 爆弾ではないマスが開かれている場合
      if (!bombBoard[y][x] && visible[y][x] !== '?' && visible[y][x] !== 'F') {
        openedSafeCells++;
      }
    }
  }
  
  // 安全なマスがすべて開かれている場合に勝利
  const totalSafeCells = HEIGHT * WIDTH - bombs;
  if (openedSafeCells === totalSafeCells) {
    gameOver = true;
    // 勝利時は盤面をそのまま維持（revealAllを呼ばない）
    // 自動オープン中でない場合のみ即座に勝利メッセージを表示
    if (!autoOpenInProgress) {
      showWinMessage();
    }
    // 自動オープン中の場合は、autoOpenCells内で完了後に表示される
  } else {
    updateDisplay();
  }
}

function showWinMessage() {
  if (!winMessageShown) {
    winMessageShown = true;
    showGameMessage('おめでとうございます！🎉', 'win');
  }
}

function showGameMessage(message, type) {
  const overlay = document.getElementById('game-overlay');
  const gameMessage = document.getElementById('game-message');
  const h2 = gameMessage.querySelector('h2');
  
  h2.textContent = message;
  gameMessage.className = `game-message ${type}`;
  overlay.style.display = 'flex';
}

function updateDisplay() {
  const probs = firstMove ? null : computeProbabilities(visible, bombs);
  const autoOpenCheckbox = document.getElementById('auto-open');
  const autoFlagCheckbox = document.getElementById('auto-flag');
  const autoOpen = autoOpenCheckbox ? autoOpenCheckbox.checked : false;
  const autoFlag = autoFlagCheckbox ? autoFlagCheckbox.checked : false;
  const table = document.getElementById('board');
  
  // 自動オープンが有効で確率が0のセルを収集
  const zeroRiskCells = [];
  if (autoOpen && probs && !gameOver) {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (visible[y][x] === '?' && probs[y][x] === 0) {
          zeroRiskCells.push({y, x});
        }
      }
    }
  }
  
  // 自動フラグが有効で確率が100%のセルを収集
  const highRiskCells = [];
  if (autoFlag && probs && !gameOver) {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (visible[y][x] === '?' && probs[y][x] === 1) {
          highRiskCells.push({y, x});
        }
      }
    }
  }
  
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const td = table.rows[y].cells[x];
      const cell = visible[y][x];
      td.className = '';
      td.textContent = '';
      td.removeAttribute('data-prob');
      if (cell === '?') {
        td.classList.add('prob');
        const p = probs ? probs[y][x] : null;
        if (p !== null) {
          td.dataset.prob = (p * 100).toFixed(1) + '%';
          
          // Set background color based on probability
          let bgColor, textColor, fontWeight;
          if (p < 0.1) {
            // Very safe (green)
            bgColor = `hsl(120, ${40 + p * 300}%, ${85 - p * 200}%)`;
            textColor = '#2d5016';
            fontWeight = '600';
            td.setAttribute('data-prob-value', 'safe');
          } else if (p < 0.3) {
            // Low risk (yellow-green)
            const scale = (p - 0.1) / 0.2;
            bgColor = `hsl(${120 - scale * 60}, 60%, ${80 - scale * 15}%)`;
            textColor = '#4a4600';
            fontWeight = '700';
            td.setAttribute('data-prob-value', 'low');
          } else if (p < 0.7) {
            // Medium risk (orange)
            const scale = (p - 0.3) / 0.4;
            bgColor = `hsl(${60 - scale * 30}, 70%, ${75 - scale * 10}%)`;
            textColor = '#663300';
            fontWeight = '700';
            td.setAttribute('data-prob-value', 'medium');
          } else {
            // High risk (red)
            const scale = (p - 0.7) / 0.3;
            bgColor = `hsl(${30 - scale * 30}, 80%, ${70 - scale * 10}%)`;
            textColor = '#660000';
            fontWeight = '800';
            td.setAttribute('data-prob-value', 'high');
          }
          
          td.style.backgroundColor = bgColor;
          td.style.color = textColor;
          td.style.fontWeight = fontWeight;
        } else {
          td.style.backgroundColor = '';
          td.style.color = '';
          td.style.fontWeight = '';
        }
      } else if (cell === 'F') {
        td.classList.add('flag');
        td.textContent = '🚩';
        td.style.backgroundColor = '';
        td.style.color = '';
        td.style.fontWeight = '';
      } else if (cell === '💣') {
        td.classList.add('open');
        td.textContent = '💣';
        // 爆発したセルかどうかをチェック
        if (explodedCell && explodedCell.y === y && explodedCell.x === x) {
          td.style.backgroundColor = '#ff4757'; // 赤色
          td.classList.add('exploded');
        } else {
          td.style.backgroundColor = '#ffffff';
        }
        td.style.color = '';
        td.style.fontWeight = '';
      } else {
        td.classList.add('open');
        if (cell !== '.') td.textContent = cell;
        td.style.backgroundColor = '#ffffff';
        td.style.color = '';
        td.style.fontWeight = '';
      }
    }
  }
  
  // 危険度100%のセルに即座に自動フラグ
  if (highRiskCells.length > 0) {
    let flagsAdded = false;
    for (const cell of highRiskCells) {
      if (visible[cell.y][cell.x] === '?') {
        visible[cell.y][cell.x] = 'F';
        flagsAdded = true;
      }
    }
    // フラグ設置後、表示を更新（再帰呼び出しを避けるため直接セル更新）
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const td = table.rows[y].cells[x];
        const cell = visible[y][x];
        if (cell === 'F') {
          td.className = 'flag';
          td.textContent = '🚩';
          td.style.backgroundColor = '';
          td.style.color = '';
          td.style.fontWeight = '';
        }
      }
    }
    // フラグを新しく立てた場合、勝利チェックを実行
    if (flagsAdded) {
      checkWin();
      return; // 勝利チェック後は処理を終了
    }
  }
  
  // 危険度0%のセルを1マスずつ順次自動オープン
  if (zeroRiskCells.length > 0) {
    autoOpenInProgress = true;
    autoOpenCells(zeroRiskCells, 0);
  }
}

function autoOpenCells(cells, index) {
  // 自動オープンが無効になっていたら停止
  const autoOpenCheckbox = document.getElementById('auto-open');
  const autoOpen = autoOpenCheckbox ? autoOpenCheckbox.checked : false;
  
  if (index >= cells.length || gameOver || !autoOpen) {
    // 自動オープン完了または中断
    autoOpenInProgress = false;
    // 勝利判定が遅延されている場合の処理
    if (gameOver && !winMessageShown) {
      setTimeout(() => {
        showWinMessage();
      }, 200);
    }
    return;
  }
  
  const cell = cells[index];
  if (visible[cell.y][cell.x] === '?') {
    // セルを開く前に一瞬ハイライト
    const table = document.getElementById('board');
    const td = table.rows[cell.y].cells[cell.x];
    const originalBg = td.style.backgroundColor;
    
    // ハイライト効果
    td.style.backgroundColor = '#74b9ff';
    td.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      // 自動オープンが無効になっていたら停止
      const autoOpenCheckbox = document.getElementById('auto-open');
      const autoOpen = autoOpenCheckbox ? autoOpenCheckbox.checked : false;
      if (!autoOpen) {
        // ハイライトを元に戻して停止
        td.style.backgroundColor = originalBg;
        td.style.transform = '';
        autoOpenInProgress = false;
        return;
      }
      
      // 元のスタイルに戻してからセルを開く
      td.style.backgroundColor = originalBg;
      td.style.transform = '';
      
      openCell(cell.y, cell.x);
      
      // 次のセルを500ms後に処理
      setTimeout(() => {
        autoOpenCells(cells, index + 1);
      }, 500);
    }, 200); // ハイライトを200ms表示
  } else {
    // このセルが既に開いている場合は次へ
    autoOpenCells(cells, index + 1);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('new-game');
  if (btn) btn.addEventListener('click', () => {
    // オーバーレイを非表示にしてからゲームを初期化
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.style.display = 'none';
    initGame();
  });
  const wInput = document.getElementById('width-input');
  const hInput = document.getElementById('height-input');
  const bombInput = document.getElementById('bomb-count');
  const autoOpenCheckbox = document.getElementById('auto-open');
  const autoFlagCheckbox = document.getElementById('auto-flag');
  
  if (wInput) wInput.addEventListener('input', () => {
    // ゲーム中は変更を無視
    if (!firstMove && !gameOver) {
      wInput.value = WIDTH;
      return;
    }
    let val = parseInt(wInput.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
      wInput.value = 1;
    } else if (val > 15) {
      val = 15;
      wInput.value = 15;
    }
    WIDTH = val;
    // 爆弾数がフィールドサイズに対して大きすぎる場合は調整
    const maxBombs = WIDTH * HEIGHT - 1;
    if (bombs > maxBombs) {
      bombs = maxBombs;
      const bombInput = document.getElementById('bomb-count');
      if (bombInput) bombInput.value = maxBombs;
    }
    initGame();
  });
  if (hInput) hInput.addEventListener('input', () => {
    // ゲーム中は変更を無視
    if (!firstMove && !gameOver) {
      hInput.value = HEIGHT;
      return;
    }
    let val = parseInt(hInput.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
      hInput.value = 1;
    } else if (val > 15) {
      val = 15;
      hInput.value = 15;
    }
    HEIGHT = val;
    // 爆弾数がフィールドサイズに対して大きすぎる場合は調整
    const maxBombs = WIDTH * HEIGHT - 1;
    if (bombs > maxBombs) {
      bombs = maxBombs;
      const bombInput = document.getElementById('bomb-count');
      if (bombInput) bombInput.value = maxBombs;
    }
    initGame();
  });
  if (bombInput) bombInput.addEventListener('input', () => {
    // ゲーム中は変更を無視
    if (!firstMove && !gameOver) {
      bombInput.value = bombs;
      return;
    }
    let val = parseInt(bombInput.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
      bombInput.value = 1;
    }
    // 爆弾数がフィールドのセル数-1を超える場合は調整
    const maxBombs = WIDTH * HEIGHT - 1;
    if (val > maxBombs) {
      val = maxBombs;
      bombInput.value = maxBombs;
    }
    bombs = val;
    updateInfo();
    // ゲーム開始前なら確率表示を更新
    if (!gameOver && !firstMove) {
      updateDisplay();
    }
  });
  
  // 自動オープンチェックボックスの変更イベント
  if (autoOpenCheckbox) {
    autoOpenCheckbox.addEventListener('change', () => {
      // チェックボックスの状態が変わったら即座にupdateDisplayを実行
      if (!gameOver && !firstMove) {
        updateDisplay();
      }
    });
  }
  
  // 自動フラグチェックボックスの変更イベント
  if (autoFlagCheckbox) {
    autoFlagCheckbox.addEventListener('change', () => {
      // チェックボックスの状態が変わったら即座にupdateDisplayを実行
      if (!gameOver && !firstMove) {
        updateDisplay();
      }
    });
  }
  
  initGame();
});
