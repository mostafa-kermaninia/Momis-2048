import React, { useState, useEffect, useCallback, useRef } from 'react'; // ✨ useRef اضافه شد
import './Game2048.css';

// ... (تمام توابع کمکی بازی مثل createEmptyGrid, addRandomTile, move و... بدون تغییر باقی می‌مانند)
const localStorageManager = {
  getBestScore: () => parseInt(window.localStorage.getItem('bestScore') || '0', 10),
  setBestScore: (score) => window.localStorage.setItem('bestScore', score),
};

const createEmptyGrid = () => Array.from({ length: 4 }, () => Array(4).fill(null));

const getRandomAvailableCell = (grid) => {
  const availableCells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (!grid[y][x]) {
        availableCells.push({ x, y });
      }
    }
  }
  if (availableCells.length > 0) {
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  }
  return null;
};

const addRandomTile = (grid) => {
  const newGrid = grid.map(row => [...row]);
  const cell = getRandomAvailableCell(newGrid);
  if (cell) {
    const value = Math.random() < 0.9 ? 2 : 4;
    newGrid[cell.y][cell.x] = { value, id: Date.now() + Math.random(), isNew: true };
  }
  return newGrid;
};

const movesAvailable = (grid) => {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const cell = grid[y][x];
            if (!cell) return true;
            if (x < 3 && cell.value === grid[y][x + 1]?.value) return true;
            if (y < 3 && cell.value === grid[y + 1][x]?.value) return true;
        }
    }
    return false;
};

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
      row[i+1] = null;
    }
  }
  return { newRow: row, score: scoreToAdd };
};

const transposeGrid = (grid) => {
    const newGrid = createEmptyGrid();
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            newGrid[x][y] = grid[y][x];
        }
    }
    return newGrid;
};

const move = (grid, direction) => {
    let currentGrid = grid.map(row => row.map(cell => cell ? { ...cell, isNew: false, isMerged: false } : null));
    let score = 0;
    let moved = false;
    
    const isHorizontal = direction === 0 || direction === 2;
    const isReversed = direction === 2 || direction === 3;

    if (!isHorizontal) currentGrid = transposeGrid(currentGrid);
    
    for (let y = 0; y < 4; y++) {
        const originalRow = [...currentGrid[y]];
        let row = [...originalRow];
        if (isReversed) row.reverse();

        const slidRow = slide(row);
        const { newRow, score: newScore } = combine(slidRow);
        let finalRow = slide(newRow);
        
        score += newScore;

        if (isReversed) finalRow.reverse();
        currentGrid[y] = finalRow;

        for(let x = 0; x < 4; x++) {
            if (originalRow[x]?.value !== finalRow[x]?.value) {
                moved = true;
            }
        }
    }
    
    if (!isHorizontal) currentGrid = transposeGrid(currentGrid);
    
    return { newGrid: currentGrid, score, moved };
};


// کامپوننت اصلی بازی
const Game2048 = ({ onGameOver }) => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(localStorageManager.getBestScore());
  const [isGameOver, setGameOver] = useState(false);

  // ✨ بخش جدید: State برای ذخیره مختصات شروع لمس
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const gameContainerRef = useRef(null); // ✨ رفرنس به کانتینر بازی

  const setupGame = useCallback(() => {
    let newGrid = addRandomTile(createEmptyGrid());
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    setupGame();
  }, [setupGame]);

  // ✨ تابع جدید: پردازش حرکت و پایان بازی
  const processMove = useCallback((direction) => {
    if (isGameOver) return;
    
    const { newGrid, score: newScore, moved } = move(grid, direction);

    if (moved) {
        const gridWithNewTile = addRandomTile(newGrid);
        setGrid(gridWithNewTile);
        
        const updatedScore = score + newScore;
        setScore(updatedScore);

        if (updatedScore > bestScore) {
            setBestScore(updatedScore);
            localStorageManager.setBestScore(updatedScore);
        }
        
        if (!movesAvailable(gridWithNewTile)) {
            setGameOver(true);
            onGameOver(updatedScore); 
        }
    }
  }, [grid, score, bestScore, isGameOver, onGameOver]);

  // مدیریت کیبورد
  const handleKeyDown = useCallback((e) => {
    let direction = -1;
    switch (e.key) {
      case 'ArrowUp':    direction = 1; break;
      case 'ArrowRight': direction = 2; break;
      case 'ArrowDown':  direction = 3; break;
      case 'ArrowLeft':  direction = 0; break;
      default: return;
    }
    e.preventDefault();
    processMove(direction);
  }, [processMove]);
  
  // ✨ بخش جدید: توابع مدیریت لمس
  const handleTouchStart = (e) => {
    if (e.touches.length > 1) return; // فقط یک انگشت
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length > 1) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { // حداقل 30 پیکسل جابجایی
      // تشخیص جهت اصلی (افقی یا عمودی)
      const direction = absDx > absDy ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1);
      processMove(direction);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    // ✨ اتصال رویدادهای لمسی به کانتینر بازی
    const gameElement = gameContainerRef.current;
    if (gameElement) {
        gameElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameElement) {
        gameElement.removeEventListener('touchstart', handleTouchStart);
        gameElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleKeyDown]); // وابستگی handleKeyDown کافیست چون processMove را در خود دارد

  const tiles = grid.flatMap((row, y) => 
    row.map((cell, x) => (cell ? { ...cell, x, y } : null))
  ).filter(Boolean);

  return (
    // ✨ اضافه کردن ref به این div
    <div className="game-wrapper" ref={gameContainerRef}>
      <div className="game-header">
        <h1 className="title">2048</h1>
        <div className="scores-container">
          <div className="score-container">{score}</div>
          <div className="best-container">{bestScore}</div>
        </div>
      </div>
      <div className="above-game">
          <p className="game-intro">Join numbers, get to the <strong>2048 tile!</strong></p>
          <a className="restart-button" onClick={setupGame}>New Game</a>
      </div>

      <div className="game-container">
        {isGameOver && (
            <div className="game-message">
                <p>Game Over!</p>
            </div>
        )}

        <div className="grid-container">
          {[...Array(16)].map((_, i) => (
              <div key={i} className="grid-cell" />
          ))}
        </div>

        <div className="tile-container">
          {tiles.map(tile => (
              <div key={tile.id} className={`tile tile-${tile.value} tile-position-${tile.x + 1}-${tile.y + 1} ${tile.isNew ? 'tile-new' : ''}`}>
                  <div className="tile-inner">{tile.value}</div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game2048;