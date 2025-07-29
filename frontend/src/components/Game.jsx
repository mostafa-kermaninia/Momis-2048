import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import { useSwipeable } from 'react-swipeable';

let tileIdCounter = 1;

// توابع کمکی برای ایجاد و اضافه کردن کاشی (بدون تغییر)
const createTile = (row, col, value) => ({ id: tileIdCounter++, row, col, value });
const addRandomTile = (tiles) => {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!tiles.some(t => t.row === r && t.col === c)) {
                emptyCells.push({ r, c });
            }
        }
    }
    if (emptyCells.length === 0) return { newTiles: tiles };
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const newTile = { ...createTile(r, c, value), isNew: true };
    return { newTiles: [...tiles, newTile], addedTile: newTile };
};


const Game = ({ onGameOver, onExit }) => {
    const [tiles, setTiles] = useState(() => addRandomTile(addRandomTile([]).newTiles).newTiles);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('bestScore')) || 0);
    const [isMoving, setIsMoving] = useState(false);

    const restartGame = useCallback(() => {
        tileIdCounter = 1; // ریست کردن شمارنده ID
        setTiles(addRandomTile(addRandomTile([]).newTiles).newTiles);
        setScore(0);
        // gameOver state در App.js مدیریت می‌شود، اینجا فقط تابع را صدا می‌زنیم
    }, []);

    useEffect(() => {
        if (score > bestScore) {
            setBestScore(score);
            localStorage.setItem('bestScore', score);
        }
    }, [score, bestScore]);

    const move = useCallback((dx, dy) => {
        if (isMoving) return;

        const vector = { dx, dy }; // {x, y}
        const traverse = { x: [], y: [] };
        for (let i = 0; i < 4; i++) {
            traverse.x.push(i);
            traverse.y.push(i);
        }
        if (vector.dx === 1) traverse.x = traverse.x.reverse();
        if (vector.dy === 1) traverse.y = traverse.y.reverse();
        
        let currentTiles = JSON.parse(JSON.stringify(tiles));
        let hasChanged = false;
        let newScore = 0;

        // پاک کردن فلگ‌های انیمیشن از حرکت قبلی
        currentTiles.forEach(tile => {
            tile.isNew = false;
            tile.isMerged = false;
        });

        traverse.y.forEach(row => {
            traverse.x.forEach(col => {
                const currentTile = currentTiles.find(t => t.row === row && t.col === col);
                if (!currentTile) return;

                let lastPos = { row, col };
                let nextPos;
                let nextTile;

                do {
                    nextPos = { row: lastPos.row + vector.dy, col: lastPos.col + vector.dx };
                    nextTile = currentTiles.find(t => t.row === nextPos.row && t.col === nextPos.col);

                    if (nextPos.row < 0 || nextPos.row >= 4 || nextPos.col < 0 || nextPos.col >= 4 ||
                        (nextTile && nextTile.value !== currentTile.value) || (nextTile && nextTile.isMerged)) {
                        break;
                    }
                    lastPos = nextPos;
                } while (true);

                const finalPos = lastPos;
                const movingTile = currentTiles.find(t => t.id === currentTile.id);
                const isPositionChanged = movingTile.row !== finalPos.row || movingTile.col !== finalPos.col;

                if (nextTile && nextTile.value === currentTile.value && !nextTile.isMerged) {
                    nextTile.value *= 2;
                    nextTile.isMerged = true;
                    newScore += nextTile.value;
                    const indexToRemove = currentTiles.findIndex(t => t.id === movingTile.id);
                    currentTiles.splice(indexToRemove, 1);
                    hasChanged = true;
                } else if (isPositionChanged) {
                    movingTile.row = finalPos.row;
                    movingTile.col = finalPos.col;
                    hasChanged = true;
                }
            });
        });

        if (hasChanged) {
            setIsMoving(true);
            const { newTiles: finalTiles } = addRandomTile(currentTiles);
            setTiles(finalTiles);
            setScore(s => s + newScore);
            setTimeout(() => setIsMoving(false), 150); // زمان انیمیشن
        }

    }, [tiles, isMoving]);
    
    // چک کردن پایان بازی
    useEffect(() => {
        const canMove = (tile) => {
            const { row, col, value } = tile;
            const canMoveTo = (r, c) => {
                if (r < 0 || r >= 4 || c < 0 || c >= 4) return false;
                const other = tiles.find(t => t.row === r && t.col === c);
                return !other || other.value === value;
            };
            return canMoveTo(row, col + 1) || canMoveTo(row, col - 1) || canMoveTo(row + 1, col) || canMoveTo(row - 1, col);
        };

        if (tiles.length === 16 && !tiles.some(canMove)) {
            if (typeof onGameOver === 'function') {
                onGameOver(score);
            }
        }
    }, [tiles, score, onGameOver]);

    // مدیریت ورودی
    const handleKeyDown = useCallback((e) => {
        e.preventDefault();
        switch (e.key) {
            case 'ArrowLeft': move(-1, 0); break; case 'ArrowRight': move(1, 0); break;
            case 'ArrowUp': move(0, -1); break; case 'ArrowDown': move(0, 1); break;
            default: break;
        }
    }, [move]);
    
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => move(-1, 0), onSwipedRight: () => move(1, 0),
        onSwipedUp: () => move(0, -1), onSwipedDown: () => move(0, 1),
        preventDefaultTouchmoveEvent: true, trackMouse: true
    });

    useEffect(() => {
        const gameWrapper = document.querySelector('.game-wrapper');
        if (gameWrapper) {
            gameWrapper.addEventListener('keydown', handleKeyDown);
            gameWrapper.focus();
            return () => gameWrapper.removeEventListener('keydown', handleKeyDown);
        }
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
                    <p className="game-intro-text">Join the numbers and get to <strong>2048!</strong></p>
                    <button onClick={restartGame} className="restart-button">New Game</button>
                </div>
                <Board tiles={tiles} />
            </div>
            {onExit && <button onClick={onExit} className="exit-button">Back to Lobby</button>}
        </div>
    );
};

export default Game;