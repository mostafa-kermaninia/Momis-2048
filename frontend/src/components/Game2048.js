import React, { useState, useEffect } from 'react';
import './Game2048.css'; // ما همچنان از CSS شما استفاده می‌کنیم

// این یک ابزار ساده برای مدیریت ذخیره‌سازی در مرورگر است
// جایگزین local_storage_manager.js
const localStorageManager = {
  getBestScore: () => parseInt(window.localStorage.getItem('bestScore') || '0', 10),
  setBestScore: (score) => window.localStorage.setItem('bestScore', score),
};

// ================================================================
// منطق اصلی بازی (الهام گرفته از game_manager.js و grid.js)
// ================================================================

// تابع برای ساخت یک گرید خالی
const createEmptyGrid = () => Array.from({ length: 4 }, () => Array(4).fill(null));

// تابع برای پیدا کردن یک موقعیت خالی تصادفی
const getRandomAvailableCell = (grid) => {
  const availableCells = [];
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      if (!grid[x][y]) {
        availableCells.push({ x, y });
      }
    }
  }
  if (availableCells.length > 0) {
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  }
  return null;
};

// تابع برای اضافه کردن یک کاشی جدید (معمولاً 2 یا 4)
const addRandomTile = (grid) => {
  const newGrid = grid.map(row => [...row]);
  const cell = getRandomAvailableCell(newGrid);
  if (cell) {
    const value = Math.random() < 0.9 ? 2 : 4;
    newGrid[cell.x][cell.y] = { value, id: Date.now() + Math.random(), isNew: true };
  }
  return newGrid;
};

// توابع کمکی برای حرکت
const slide = (row) => {
  const arr = row.filter(val => val);
  const missing = 4 - arr.length;
  const zeros = Array(missing).fill(null);
  return arr.concat(zeros);
};

const combine = (row) => {
  let scoreToAdd = 0;
  for (let i = 0; i < 3; i++) {
    if (row[i] && row[i].value === row[i + 1]?.value) {
      scoreToAdd += row[i].value * 2;
      row[i] = { ...row[i], value: row[i].value * 2, isMerged: true };
      row[i + 1] = null;
    }
  }
  return { newRow: row, score: scoreToAdd };
};

const rotateGrid = (grid) => {
    const newGrid = createEmptyGrid();
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            newGrid[x][y] = grid[3 - y][x];
        }
    }
    return newGrid;
};

const moveGrid = (grid, direction) => {
    let currentGrid = grid.map(row => row.map(cell => cell ? { ...cell, isNew: false, isMerged: false } : null));
    let score = 0;
    let moved = false;
    
    // 0: up, 1: right, 2: down, 3: left
    for(let i = 0; i < direction; i++) {
        currentGrid = rotateGrid(currentGrid);
    }

    for (let y = 0; y < 4; y++) {
        const originalRow = [...currentGrid[y]];
        const slidRow = slide(currentGrid[y]);
        const { newRow, score: newScore } = combine(slidRow);
        currentGrid[y] = slide(newRow);
        score += newScore;
        
        // چک می‌کنیم آیا تغییری ایجاد شده
        for(let x = 0; x < 4; x++) {
            if (originalRow[x]?.value !== currentGrid[y][x]?.value) {
                moved = true;
            }
        }
    }

    for(let i = 0; i < (4 - direction) % 4; i++) {
        currentGrid = rotateGrid(currentGrid);
    }
    
    return { newGrid: currentGrid, score, moved };
};


// ================================================================
// کامپوننت اصلی بازی
// ================================================================
const Game2048 = () => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(localStorageManager.getBestScore());
  const [isGameOver, setGameOver] = useState(false);

  const setupGame = () => {
    let newGrid = addRandomTile(createEmptyGrid());
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  };

  // شروع بازی در اولین رندر
  useEffect(() => {
    setupGame();
  }, []);

  const handleKeyDown = (e) => {
    if (isGameOver) return;
    
    let direction = -1;
    switch (e.key) {
      case 'ArrowUp': direction = 0; break;
      case 'ArrowRight': direction = 1; break;
      case 'ArrowDown': direction = 2; break;
      case 'ArrowLeft': direction = 3; break;
      default: return;
    }
    e.preventDefault();

    const { newGrid, score: newScore, moved } = moveGrid(grid, direction);

    if (moved) {
        const gridWithNewTile = addRandomTile(newGrid);
        setGrid(gridWithNewTile);
        
        const updatedScore = score + newScore;
        setScore(updatedScore);

        if (updatedScore > bestScore) {
            setBestScore(updatedScore);
            localStorageManager.setBestScore(updatedScore);
        }
    }
    // اینجا باید منطق پایان بازی را هم اضافه کنید
  };
  
  // مدیریت ورودی کیبورد
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [grid, score, isGameOver]); // وابستگی‌ها برای استفاده از آخرین state

  // تبدیل گرید به یک آرایه مسطح از کاشی‌ها برای رندر کردن
  const tiles = grid.flatMap((row, y) => 
    row.map((cell, x) => (cell ? { ...cell, x, y } : null))
  ).filter(Boolean);


  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="title">2048</h1>
        <div className="scores-container">
          <div className="score-container">{score}</div>
          <div className="best-container">{bestScore}</div>
        </div>
      </div>
      <div className="above-game">
          <p className="game-intro">Join the numbers and get to the <strong>2048 tile!</strong></p>
          <a className="restart-button" onClick={setupGame}>New Game</a>
      </div>

      {/* نمایش پیام پایان بازی */}
      {isGameOver && (
          <div className="game-message">
              <p>Game Over!</p>
              <div className="lower">
                  <a className="retry-button" onClick={setupGame}>Try again</a>
              </div>
          </div>
      )}

      {/* رندر کردن گرید و کاشی‌ها */}
      <div className="grid-container">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="grid-row">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="grid-cell" />
            ))}
          </div>
        ))}
      </div>

      <div className="tile-container">
        {tiles.map(tile => (
            <div key={tile.id} className={`tile tile-${tile.value} tile-position-${tile.x + 1}-${tile.y + 1} ${tile.isNew ? 'tile-new' : ''} ${tile.isMerged ? 'tile-merged' : ''}`}>
                <div className="tile-inner">{tile.value}</div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Game2048;