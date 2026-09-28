(() => {
  'use strict';

  const canvas = document.getElementById('tetrisCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  const COLUMNS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = canvas.width / COLUMNS; // 30px per cell

  // Tetromino shapes as 4x4 matrices (1 = block, 0 = empty)
  const PIECES = [
    // I
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    // O
    [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // T
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // S
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // Z
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // J
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // L
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ];

  let arena = [];
  let score = 0;
  let gameOver = false;
  let paused = false;
  let dropCounter = 0;
  let dropInterval = 1000; // ms per soft drop step
  let animationId = null;
  let currentPiece;
  let nextPiece;

  // Build initial arena grid (0 = empty)
  function initArena() {
    arena = [];
    for (let y = 0; y < ROWS; y++) {
      arena[y] = [];
      for (let x = 0; x < COLUMNS; x++) {
        arena[y][x] = 0;
      }
    }
  }

  // Create a new piece with position and matrix copy
  function newPiece() {
    const type = Math.floor(Math.random() * PIECES.length);
    return {
      type,
      matrix: PIECES[type].map(row => [...row]), // copy row arrays
      pos: { x: 5, y: 0 }, // start column, row 0
    };
  }

  // Convert piece matrix to absolute arena coordinates and check collision
  function collision(piece, deltaX = 0, deltaY = 0) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (piece.matrix[y][x]) {
          const newX = piece.pos.x + x + deltaX;
          const newY = piece.pos.y + y + deltaY;

          // Out of bounds
          if (newX < 0 || newX >= COLUMNS || newY >= ROWS) return true;
          // Already occupied
          if (newY >= 0 && arena[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  // Merge piece blocks into arena
  function merge(piece) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (piece.matrix[y][x]) {
          const ay = piece.pos.y + y;
          const ax = piece.pos.x + x;
          if (ay >= 0) arena[ay][ax] = piece.type + 1; // store piece type (1..7)
        }
      }
    }
  }

  // Clear completed lines and shift down
  function sweep() {
    let linesCleared = 0;

    outer: for (let y = ROWS - 1; y >= 0; --y) {
      for (let x = 0; x < COLUMNS; ++x) {
        if (arena[y][x] === 0) continue outer;
      }
      // Remove this row
      arena.splice(y, 1); // take row out
      arena.unshift(new Array(COLUMNS).fill(0)); // add empty row at top
      ++linesCleared;
    }

    // Score based on lines cleared
    switch (linesCleared) {
      case 1: score += 100; break;
      case 2: score += 300; break;
      case 3: score += 500; break;
      case 4: score += 800; break;
    }
    scoreEl.textContent = score;
  }

  // Rotate a 4x4 matrix 90 degrees clockwise
  function rotateMatrix(matrix) {
    const rotated = [];
    for (let i = 0; i < 4; i++) rotated[i] = [0, 0, 0, 0];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        rotated[x][3 - y] = matrix[y][x];
      }
    }
    return rotated;
  }

  // Lock piece (merge + sweep), then spawn next piece
  function lockPiece(piece) {
    merge(piece);
    sweep();

    // Spawn the next piece
    currentPiece = nextPiece;
    nextPiece = newPiece();

    // Game over: new piece immediately collides at spawn position
    if (collision(currentPiece)) {
      gameOver = true;
    }
  }

  // Player input handler
  function controls(e) {
    if (e.type === 'keydown' && e.key.toLowerCase() === 'p' && !e.repeat) {
      togglePause();
      return;
    }
    if (gameOver) return;
    if (e.type === 'keyup') {
      if (e.key === 'ArrowDown') dropInterval = 1000; // restore speed on release
      return;
    }
    if (paused) return;
    if (e.key === 'ArrowLeft') {
      if (!collision(currentPiece, -1, 0)) currentPiece.pos.x--;
    } else if (e.key === 'ArrowRight') {
      if (!collision(currentPiece, 1, 0)) currentPiece.pos.x++;
    } else if (e.key === 'ArrowDown') {
      dropInterval = 100; // faster drop while held
    } else if (e.key === 'ArrowUp') {
      const rotated = rotateMatrix(currentPiece.matrix);
      // Try rotating in place first, then wall-kick ±1, ±2
      const kicks = [0, 1, -1, 2, -2];
      for (const kick of kicks) {
        if (!collisionMatrix(rotated, currentPiece.pos.x + kick, currentPiece.pos.y)) {
          currentPiece.pos.x += kick;
          currentPiece.matrix = rotated;
          break;
        }
      }
    }
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(paused));
    dropInterval = 1000;
  }

  // Collision check with an arbitrary matrix and position
  function collisionMatrix(matrix, px, py) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (matrix[y][x]) {
          const nx = px + x;
          const ny = py + y;
          if (nx < 0 || nx >= COLUMNS || ny >= ROWS) return true;
          if (ny >= 0 && arena[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  // Soft drop: move piece down one step
  function drop() {
    if (!collision(currentPiece, 0, 1)) {
      currentPiece.pos.y++;
    } else {
      lockPiece(currentPiece);
      dropInterval = 1000; // reset to soft-drop speed
    }
  }

  // Main game loop – runs every frame (~60 fps)
  function gameLoop() {
    // Clear and draw arena
    ctx.fillStyle = '#10131a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a clear 10 × 20 playfield grid so empty cells remain visible.
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.58)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLUMNS; x++) {
      const px = x * BLOCK_SIZE + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
    }
    for (let y = 0; y <= ROWS; y++) {
      const py = y * BLOCK_SIZE + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
    }
    ctx.stroke();

    // Emphasize the outer edge of the playfield.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

    // Draw arena cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        if (arena[y][x]) {
          ctx.fillStyle = '#455a64';
          ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          ctx.strokeStyle = '#212121';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }
      }
    }

    if (gameOver) {
      // Semi-transparent dark overlay over the board
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Centred game-over panel
      const panelW = 220, panelH = 110;
      const panelX = (canvas.width - panelW) / 2;
      const panelY = (canvas.height - panelH) / 2;
      ctx.fillStyle = 'rgba(16, 19, 26, 0.92)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 12);
      ctx.fill();

      ctx.fillStyle = '#ffb74d';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, panelY + 45);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Final Score: ' + score, canvas.width / 2, panelY + 80);
      ctx.textAlign = 'left';
      return; // stop animation
    }

    // Draw current piece
    currentPiece.matrix.forEach((row, ry) => {
      row.forEach((cell, rx) => {
        if (cell) {
          const px = (currentPiece.pos.x + rx) * BLOCK_SIZE;
          const py = (currentPiece.pos.y + ry) * BLOCK_SIZE;
          ctx.fillStyle = '#ffb74d';
          ctx.fillRect(px, py, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          ctx.strokeStyle = '#212121';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }
      });
    });

    if (paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(16, 19, 26, 0.94)';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 105, canvas.height / 2 - 48, 210, 96, 12);
      ctx.fill();
      ctx.fillStyle = '#f5f7fb';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', canvas.width / 2, canvas.height / 2 - 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px Arial';
      ctx.fillText('Press P or Resume to continue', canvas.width / 2, canvas.height / 2 + 23);
      ctx.textAlign = 'left';
    } else {
      dropCounter += 16; // approx 16ms per frame
      if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
      }
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  // Initialise the game
  function init() {
    // Cancel any running animation frame before restarting
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    initArena();
    currentPiece = newPiece();
    nextPiece = newPiece();
    score = 0;
    gameOver = false;
    paused = false;
    pauseBtn.textContent = 'Pause';
    pauseBtn.setAttribute('aria-pressed', 'false');
    dropCounter = 0;
    dropInterval = 1000;
    scoreEl.textContent = '0';
    window.removeEventListener('keydown', controls);
    window.removeEventListener('keyup', controls);
    window.addEventListener('keydown', controls);
    window.addEventListener('keyup', controls);
    restartBtn.removeEventListener('click', init);
    restartBtn.addEventListener('click', init);
    pauseBtn.removeEventListener('click', togglePause);
    pauseBtn.addEventListener('click', togglePause);
    animationId = requestAnimationFrame(gameLoop);
  }

  // Start game
  init();
})();
