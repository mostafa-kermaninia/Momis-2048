import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import { useSwipeable } from 'react-swipeable'; // کتابخانه برای کنترل لمسی

// یک ID منحصر به فرد برای هر کاشی ایجاد می‌کند
let tileIdCounter = 1;

/**
 * یک آبجکت کاشی جدید با موقعیت و مقدار مشخص می‌سازد.
 */
const createTile = (row, col, value, isNew = false) => ({
  id: tileIdCounter++,
  row,
  col,
  value,
  isNew,
  isMerged: false,
});

/**
 * یک کاشی جدید (2 یا 4) در یک خانه خالی به صورت تصادفی اضافه می‌کند.
 */
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

/**
 * کامپوننت اصلی بازی 2048، بازنویسی شده برای UI/UX بهینه
 */
const Game = ({ sendScore }) => {
  const [tiles, setTiles] = useState(() => addRandomTile(addRandomTile([])));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('bestScore')) || 0);
  const [gameOver, setGameOver] = useState(false);

  // تابع برای شروع مجدد بازی
  const restartGame = useCallback(() => {
    setTiles(addRandomTile(addRandomTile([])));
    setScore(0);
    setGameOver(false);
  }, []);

  // ذخیره بهترین امتیاز در حافظه مرورگر
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score);
    }
  }, [score, bestScore]);

  /**
   * تابع اصلی و هوشمند برای حرکت کاشی‌ها در تمام جهات
   * @param {number} dx - حرکت افقی (-1 برای چپ, 1 برای راست)
   * @param {number} dy - حرکت عمودی (-1 برای بالا, 1 برای پایین)
   */
  const move = useCallback((dx, dy) => {
    if (gameOver) return;

    let newTiles = JSON.parse(JSON.stringify(tiles)); // کپی عمیق برای جلوگیری از تغییر مستقیم state
    let hasChanged = false;
    let newScore = 0;
    
    // مرتب‌سازی کاشی‌ها بر اساس جهت حرکت برای پردازش صحیح
    const sortedTiles = newTiles.sort((a, b) => {
        if (dx === 1) return b.col - a.col;
        if (dx === -1) return a.col - b.col;
        if (dy === 1) return b.row - a.row;
        if (dy === -1) return a.row - b.row;
        return 0;
    });

    for (const tile of sortedTiles) {
        let { row, col } = tile;
        let nextRow = row + dy;
        let nextCol = col + dx;

        // حرکت کاشی تا جایی که ممکن است
        while (nextRow >= 0 && nextRow < 4 && nextCol >= 0 && nextCol < 4) {
            const blockingTile = sortedTiles.find(t => t.row === nextRow && t.col === nextCol);
            if (blockingTile) {
                // اگر کاشی مقابل قابل ادغام است
                if (blockingTile.value === tile.value && !blockingTile.isMerged) {
                    blockingTile.value *= 2;
                    blockingTile.isMerged = true;
                    newScore += blockingTile.value;
                    
                    // حذف کاشی فعلی
                    const index = sortedTiles.findIndex(t => t.id === tile.id);
                    sortedTiles.splice(index, 1);
                    hasChanged = true;
                }
                break; // برخورد به یک کاشی دیگر
            }
            row = nextRow;
            col = nextCol;
            nextRow += dy;
            nextCol += dx;
        }

        // آپدیت موقعیت کاشی
        if (tile.row !== row || tile.col !== col) {
            tile.row = row;
            tile.col = col;
            hasChanged = true;
        }
    }
    
    // اگر تغییری رخ داده، یک کاشی جدید اضافه کن
    if (hasChanged) {
        // ریست کردن فلگ‌های انیمیشن
        newTiles.forEach(t => { t.isNew = false; t.isMerged = false; });
        const finalTiles = addRandomTile(newTiles);
        setTiles(finalTiles);
        setScore(s => s + newScore);
    }
    
  }, [tiles, gameOver]);

  // چک کردن وضعیت پایان بازی
  useEffect(() => {
    const checkGameOver = () => {
      if (tiles.length < 16) return false;

      for (const tile of tiles) {
        const { row, col, value } = tile;
        // چک کردن همسایه‌های راست و پایین
        const rightNeighbor = tiles.find(t => t.row === row && t.col === col + 1);
        if (rightNeighbor && rightNeighbor.value === value) return false;
        
        const bottomNeighbor = tiles.find(t => t.row === row + 1 && t.col === col);
        if (bottomNeighbor && bottomNeighbor.value === value) return false;
      }
      return true;
    };

    if (checkGameOver()) {
      setGameOver(true);
      sendScore(score); // ارسال امتیاز به سرور
    }
  }, [tiles, score, sendScore]);


  // مدیریت ورودی کیبورد
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft': move(-1, 0); break;
      case 'ArrowRight': move(1, 0); break;
      case 'ArrowUp': move(0, -1); break;
      case 'ArrowDown': move(0, 1); break;
      default: break;
    }
  }, [move]);

  // مدیریت ورودی لمسی (Swipe)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => move(-1, 0),
    onSwipedRight: () => move(1, 0),
    onSwipedUp: () => move(0, -1),
    onSwipedDown: () => move(0, 1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        <div className="game-intro">
          <span>Join the numbers, get to the <strong>2048 tile!</strong></span>
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
    </div>
  );
};

export default Game;