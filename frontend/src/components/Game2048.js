import React, { useState, useEffect, useCallback } from 'react';
import './Game2048.css';

const localStorageManager = {
  getBestScore: () => parseInt(window.localStorage.getItem('bestScore') || '0', 10),
  setBestScore: (score) => window.localStorage.setItem('bestScore', score),
};

// توابع کمکی بازی
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

// بررسی اینکه آیا حرکتی ممکن است یا نه
const movesAvailable = (grid) => {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const cell = grid[y][x];
            if (!cell) return true; // خانه خالی وجود دارد
            if (x < 3 && cell.value === grid[y][x + 1]?.value) return true; // امکان ادغام افقی
            if (y < 3 && cell.value === grid[y + 1][x]?.value) return true; // امکان ادغام عمودی
        }
    }
    return false;
};

// توابع حرکت
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

// ✨ تغییر در این تابع برای سادگی و خوانایی
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
    
    // 0: left, 1: up, 2: right, 3: down
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
const Game2048 = ({ onGameOver }) => { // ✨ دریافت onGameOver به عنوان prop
  const [grid, setGrid] = useState(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(localStorageManager.getBestScore());
  const [isGameOver, setGameOver] = useState(false);

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

  const handleKeyDown = useCallback((e) => {
    if (isGameOver) return;
    
    let direction = -1;
    // ✨ منطق کلیدها اصلاح شد
    switch (e.key) {
      case 'ArrowUp':    direction = 1; break;
      case 'ArrowRight': direction = 2; break;
      case 'ArrowDown':  direction = 3; break;
      case 'ArrowLeft':  direction = 0; break;
      default: return;
    }
    e.preventDefault();

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
        
        // ✨ چک کردن وضعیت پایان بازی
        if (!movesAvailable(gridWithNewTile)) {
            setGameOver(true);
            // فراخوانی تابع از App.js
            onGameOver(updatedScore); 
        }
    }
  }, [grid, score, bestScore, isGameOver, onGameOver]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const tiles = grid.flatMap((row, y) => 
    row.map((cell, x) => (cell ? { ...cell, x, y } : null))
  ).filter(Boolean);

  return (
    <div className="game-wrapper">
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
                <div className="lower">
                    {/* دکمه Try Again دیگر اینجا نیست، چون به صفحه لیدربورد منتقل می‌شود */}
                </div>
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