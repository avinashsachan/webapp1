(() => {
  'use strict';

  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const restartBtn = document.getElementById('restartBtn');

  const GRID_SIZE = 20;
  const CELL_SIZE = canvas.width / GRID_SIZE; // 20px per cell

  // Game state
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let gameOver = false;
  let particles = []; // for simple visual when eating
  let frame = 0;

  // Snake array: each segment is {x, y}
  let snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ];

  // Food position
  let food = { x: 15, y: 10 };

  // Initialize game
  function initGame() {
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = '0';
    gameOver = false;
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    spawnFood();
    gameLoop();
  }

  // Spawn food at random grid position not occupied by snake
  function spawnFood() {
    let valid = false;
    while (!valid) {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
  }

  // Draw everything
  function draw() {
    // Clear canvas
    ctx.fillStyle = '#10131a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional faint lines)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#e94560';
    ctx.fillRect(
      food.x * CELL_SIZE + 1,
      food.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );

    // Draw snake
    ctx.fillStyle = '#00ce5b';
    for (const seg of snake) {
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    }

    // Draw simple particle effect when eating (optional)
    if (particles.length > 0) {
      ctx.fillStyle = '#ffd93d';
      for (const p of particles) {
        ctx.fillRect(p.x, p.y, 4, 4);
      }
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => { p.life--; p.x += p.vx; p.y += p.vy; });
    }
  }

  // Update game state each frame
  function update() {
    if (gameOver) return;

    // Apply next direction (prevent 180-degree turns)
    if (
      nextDirection.x !== -direction.x ||
      nextDirection.y !== -direction.y
    ) {
      direction = { x: nextDirection.x, y: nextDirection.y };
    }

    // Compute new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver = true;
      alert('Game Over! Your score: ' + score);
      return;
    }

    // Self collision
    if (
      snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
      gameOver = true;
      alert('Game Over! Your score: ' + score);
      return;
    }

    // Insert new head
    snake.unshift(head);

    // Check food consumption
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      spawnFood();
      // Add a few particles for visual feedback
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: food.x * CELL_SIZE + CELL_SIZE / 2,
          y: food.y * CELL_SIZE + CELL_SIZE / 2,
          life: 30,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
        });
      }
      // Grow snake (don't remove tail)
    } else {
      // Remove tail (snake moves forward)
      snake.pop();
    }
  }

  // Game loop
  function gameLoop() {
    if (frame === 0) update();
    draw();
    frame = (frame + 1) % 10;
    if (!gameOver) {
      requestAnimationFrame(gameLoop);
    }
  }

  // Input handling
  function handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowUp':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        break;
      case ' ':
      case 'Enter':
        if (gameOver) initGame();
        break;
    }
  }

  // Restart button
  restartBtn.addEventListener('click', initGame);

  // Initialise on page load
  initGame();

  // Global keyboard listener
  window.addEventListener('keydown', handleKeyDown);
})();