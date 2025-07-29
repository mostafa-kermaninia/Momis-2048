import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import { useSwipeable } from 'react-swipeable';

// ... (توابع createTile و addRandomTile بدون تغییر باقی می‌مانند) ...
let tileIdCounter = 1;

const createTile = (row, col, value, isNew = false) => ({
  id: tileIdCounter++,
  row,
  col,
  value,
  isNew,
  isMerged: false,
});

const addRandomTile = (tiles) => {
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!tiles.some(t => t.row === r && t.col === c)) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length === 0) return tiles;

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return [...tiles, createTile(r, c, value, true)];
};


const Game = ({ onGameOver, onExit }) => {
  const [tiles, setTiles] = useState(() => addRandomTile(addRandomTile([])));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('bestScore')) || 0);
  const [gameOver, setGameOver] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // جلوگیری از حرکت‌های سریع و متوالی

  const restartGame = useCallback(() => {
    setTiles(addRandomTile(addRandomTile([])));
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score);
    }
  }, [score, bestScore]);

  const move = useCallback((dx, dy) => {
    if (gameOver || isMoving) return;
    
    setIsMoving(true);

    let newTiles = JSON.parse(JSON.stringify(tiles));
    let hasChanged = false;
    let newScore = 0;
    
    const sortedTiles = newTiles.sort((a, b) => {
        if (dx === 1) return b.col - a.col;
        if (dx === -1) return a.col - b.col;
        if (dy === 1) return b.row - a.row;
        if (dy === -1) return a.row - b.row;
        return 0;
    });

    for (const tile of sortedTiles) {
        let { row, col } = tile;
        while (true) {
            const nextRow = row + dy;
            const nextCol = col + dx;
            if (nextRow < 0 || nextRow >= 4 || nextCol < 0 || nextCol >= 4) break;
            const blockingTile = sortedTiles.find(t => t.row === nextRow && t.col === nextCol);
            if (blockingTile) {
                if (blockingTile.value === tile.value && !blockingTile.isMerged) {
                    blockingTile.value *= 2;
                    blockingTile.isMerged = true;
                    newScore += blockingTile.value;
                    const index = sortedTiles.findIndex(t => t.id === tile.id);
                    sortedTiles.splice(index, 1);
                    hasChanged = true;
                }
                break;
            }
            row = nextRow;
            col = nextCol;
        }
        if (tile.row !== row || tile.col !== col) {
            tile.row = row;
            tile.col = col;
            hasChanged = true;
        }
    }
    
    if (hasChanged) {
        newTiles.forEach(t => { t.isNew = false; t.isMerged = false; });
        const finalTiles = addRandomTile(newTiles);
        setTiles(finalTiles);
        setScore(s => s + newScore);
    }
    
    // با یک تاخیر کوتاه، اجازه حرکت بعدی را بده
    setTimeout(() => setIsMoving(false), 100);

  }, [tiles, gameOver, isMoving]);

  // 🔥 FIX: useEffect برای پایان بازی بازنویسی و ایمن شده است
  useEffect(() => {
    const checkGameOver = () => {
      if (tiles.length < 16) return false;
      for (const tile of tiles) {
        const { row, col, value } = tile;
        if (tiles.some(t => t.row === row && t.col === col + 1 && t.value === value)) return false;
        if (tiles.some(t => t.row === row + 1 && t.col === col && t.value === value)) return false;
      }
      return true;
    };
    
    if (checkGameOver()) {
      setGameOver(true);
      // اطمینان از اینکه onGameOver یک تابع است قبل از فراخوانی
      if (typeof onGameOver === 'function') {
        onGameOver(score);
      }
    }
  }, [tiles, score, onGameOver]);

  const handleKeyDown = useCallback((e) => {
    e.preventDefault(); // جلوگیری از اسکرول صفحه با کلیدهای جهت‌نما
    switch (e.key) {
      case 'ArrowLeft': move(-1, 0); break;
      case 'ArrowRight': move(1, 0); break;
      case 'ArrowUp': move(0, -1); break;
      case 'ArrowDown': move(0, 1); break;
      default: break;
    }
  }, [move]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => move(-1, 0),
    onSwipedRight: () => move(1, 0),
    onSwipedUp: () => move(0, -1),
    onSwipedDown: () => move(0, 1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  useEffect(() => {
    const gameWrapper = document.querySelector('.game-wrapper');
    gameWrapper.addEventListener('keydown', handleKeyDown);
    // فوکوس خودکار برای دریافت رویدادهای کیبورد
    gameWrapper.focus();
    return () => gameWrapper.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div {...swipeHandlers} className="game-wrapper" tabIndex={-1}>
      <div className="game-container">
        <div className="game-header">
          <h1 className="title">2048</h1>
          <div className="scores-container">
            <div className="score-box">SCORE<span>{score}</span></div>
            <div className="score-box">BEST<span>{bestScore}</span></div>
          </div>
        </div>

        {/* 🔥 FIX: ظاهر هدر بهبود یافته است */}
        <div className="game-intro">
          <p className="game-intro-text">Join the numbers, get to <strong>2048!</strong></p>
          <button onClick={restartGame} className="restart-button">New Game</button>
        </div>
        
        <Board tiles={tiles} />
        
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-box">
              <h2>Game Over!</h2>
              <button onClick={restartGame} className="restart-button">Try Again</button>
            </div>
          </div>
        )}
      </div>
      {/* دکمه خروج از بازی */}
      <button onClick={onExit} className="exit-button">Back to Lobby</button>
    </div>
  );
};

export default Game;