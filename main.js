const WIDTH = 9;
const HEIGHT = 9;
let bombs = 10;

let firstMove = true;

let bombBoard = [];
let numbers = [];
let visible = [];
let gameOver = false;

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
  bombBoard = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  numbers = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
  visible = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('?'));
  gameOver = false;
  firstMove = true;
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
    visible[y][x] = 'B';
    gameOver = true;
    revealAll();
    alert('Game Over');
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
  updateDisplay();
}

function revealAll() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (bombBoard[y][x]) {
        if (visible[y][x] !== 'B') visible[y][x] = 'B';
      } else if (visible[y][x] === '?') {
        const n = numbers[y][x];
        visible[y][x] = n === 0 ? '.' : String(n);
      }
    }
  }
  updateDisplay();
}

function checkWin() {
  let opened = 0;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (visible[y][x] !== '?' && visible[y][x] !== 'F') opened++;
    }
  }
  if (opened === HEIGHT * WIDTH - bombs) {
    gameOver = true;
    alert('You Win!');
    revealAll();
  } else {
    updateDisplay();
  }
}

function updateDisplay() {
  const probs = computeProbabilities(visible, bombs);
  const table = document.getElementById('board');
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const td = table.rows[y].cells[x];
      const cell = visible[y][x];
      td.className = '';
      td.textContent = '';
      td.removeAttribute('data-prob');
      if (cell === '?') {
        td.classList.add('prob');
        const p = probs[y][x];
        if (p !== null) {
          td.dataset.prob = (p * 100).toFixed(1) + '%';
          let hue;
          if (p <= 0.25) {
            hue = 120 - (p / 0.25) * 60;
          } else {
            hue = 60 - ((p - 0.25) / 0.75) * 60;
          }
          td.style.color = `hsl(${hue}, 70%, 45%)`;
        } else {
          td.style.color = '';
        }
      } else if (cell === 'F') {
        td.classList.add('flag');
        td.textContent = '🚩';
        td.style.color = '';
      } else if (cell === 'B') {
        td.classList.add('open');
        td.textContent = 'B';
        td.style.color = '';
      } else {
        td.classList.add('open');
        if (cell !== '.') td.textContent = cell;
        td.style.color = '';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('new-game');
  if (btn) btn.addEventListener('click', initGame);
  initGame();
});
