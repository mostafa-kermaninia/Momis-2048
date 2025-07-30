import React, { useState, useEffect, useCallback } from "react";
import "./Game2048.css"; // ما استایل‌ها را در این فایل قرار می‌دهیم

// ===============================================================
// بخش 1: پورت کردن منطق اصلی بازی (Grid and Tile Logic)
// این کدها معادل grid.js و tile.js هستند که برای کار با React بهینه شده‌اند.
// ===============================================================

// یک کلاس ساده برای مدیریت کاشی‌ها
class Tile {
    constructor(position, value) {
        this.x = position.x;
        this.y = position.y;
        this.value = value || 2;
        this.id = Math.random().toString(36).substr(2, 9); // شناسه یونیک برای key در React
        this.mergedFrom = null;
        this.previousPosition = null;
        this.isNew = true;
    }

    savePosition = () => {
        this.previousPosition = { x: this.x, y: this.y };
    };

    updatePosition = (position) => {
        this.x = position.x;
        this.y = position.y;
    };
}

// ===============================================================
// بخش 2: کامپوننت اصلی بازی Game2048
// این کامپوننت معادل GameManager، HTMLActuator و KeyboardInputManager است.
// ===============================================================

const Game2048 = ({ onGameOver }) => {
    const size = 4;
    const [grid] = useState(
        Array.from({ length: 4 }, () => Array(4).fill(null))
    );
    const [tiles, setTiles] = useState([]);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() =>
        parseInt(localStorage.getItem("bestScore") || "0", 10)
    );
    const [isGameOver, setIsGameOver] = useState(false);
    const [won, setWon] = useState(false);

    // تابع برای شروع مجدد بازی
    const restartGame = useCallback(() => {
        setScore(0);
        setIsGameOver(false);
        setWon(false);
        const initialTiles = [];
        addRandomTile(initialTiles, 2); // شروع با دو کاشی
        setTiles(initialTiles);
    }, []);

    // تابع اصلی برای اضافه کردن کاشی تصادفی
    const addRandomTile = (currentTiles, count = 1) => {
        const availableCells = [];
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const isOccupied = currentTiles.some(
                    (t) => t.x === x && t.y === y
                );
                if (!isOccupied) {
                    availableCells.push({ x, y });
                }
            }
        }

        if (availableCells.length > 0) {
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(
                    Math.random() * availableCells.length
                );
                const cell = availableCells.splice(randomIndex, 1)[0];
                const value = Math.random() < 0.9 ? 2 : 4;
                currentTiles.push(new Tile(cell, value));
            }
        }
    };

    // تابع برای آماده‌سازی کاشی‌ها قبل از هر حرکت
    const prepareTiles = (currentTiles) => {
        return currentTiles.map((tile) => {
            tile.savePosition();
            tile.mergedFrom = null;
            tile.isNew = false;
            return tile;
        });
    };

    // تابع اصلی برای حرکت کاشی‌ها
    const move = useCallback(
        (direction) => {
            if (isGameOver) return;

            const vector = {
                0: { x: 0, y: -1 },
                1: { x: 1, y: 0 },
                2: { x: 0, y: 1 },
                3: { x: -1, y: 0 },
            }[direction];

            let currentTiles = JSON.parse(JSON.stringify(tiles)); // Deep copy
            currentTiles = prepareTiles(currentTiles);

            const traversals = { x: [], y: [] };
            for (let i = 0; i < size; i++) {
                traversals.x.push(i);
                traversals.y.push(i);
            }

            if (vector.x === 1) traversals.x = traversals.x.reverse();
            if (vector.y === 1) traversals.y = traversals.y.reverse();

            let moved = false;
            let newScore = score;

            traversals.y.forEach((y) => {
                traversals.x.forEach((x) => {
                    const cell = { x, y };
                    let tile = currentTiles.find(
                        (t) => t.x === cell.x && t.y === cell.y
                    );

                    if (tile) {
                        let farthest = cell;
                        let next;
                        do {
                            next = farthest;
                            farthest = {
                                x: next.x + vector.x,
                                y: next.y + vector.y,
                            };
                        } while (
                            farthest.x >= 0 &&
                            farthest.x < size &&
                            farthest.y >= 0 &&
                            farthest.y < size &&
                            !currentTiles.some(
                                (t) => t.x === farthest.x && t.y === farthest.y
                            )
                        );

                        farthest = next; // The actual farthest position

                        const nextPos = {
                            x: farthest.x + vector.x,
                            y: farthest.y + vector.y,
                        };
                        let nextTile = currentTiles.find(
                            (t) => t.x === nextPos.x && t.y === nextPos.y
                        );

                        if (
                            nextTile &&
                            nextTile.value === tile.value &&
                            !nextTile.mergedFrom
                        ) {
                            const merged = new Tile(nextPos, tile.value * 2);
                            merged.mergedFrom = [tile, nextTile];

                            currentTiles = currentTiles.filter(
                                (t) => t.id !== tile.id && t.id !== nextTile.id
                            );
                            tile.updatePosition(nextPos);
                            currentTiles.push(merged);

                            newScore += merged.value;
                            if (merged.value === 2048) setWon(true);
                            moved = true;
                        } else {
                            if (
                                farthest.x !== tile.x ||
                                farthest.y !== tile.y
                            ) {
                                tile.updatePosition(farthest);
                                moved = true;
                            }
                        }
                    }
                });
            });

            if (moved) {
                addRandomTile(currentTiles);
                setTiles(currentTiles);
                setScore(newScore);
                if (newScore > bestScore) {
                    localStorage.setItem("bestScore", newScore);
                    setBestScore(newScore);
                }
            }
        },
        [tiles, isGameOver, score, bestScore]
    );

    // چک کردن وضعیت پایان بازی
    const checkGameOver = useCallback(() => {
        const movesAvailable = () => {
            if (tiles.length < size * size) return true;
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const tile = tiles.find((t) => t.x === x && t.y === y);
                    if (tile) {
                        for (let d = 0; d < 4; d++) {
                            const vector = {
                                0: { x: 0, y: -1 },
                                1: { x: 1, y: 0 },
                                2: { x: 0, y: 1 },
                                3: { x: -1, y: 0 },
                            }[d];
                            const otherCell = {
                                x: x + vector.x,
                                y: y + vector.y,
                            };
                            const otherTile = tiles.find(
                                (t) =>
                                    t.x === otherCell.x && t.y === otherCell.y
                            );
                            if (otherTile && otherTile.value === tile.value)
                                return true;
                        }
                    }
                }
            }
            return false;
        };

        if (!movesAvailable()) {
            setIsGameOver(true);
            // ✨ نقطه کلیدی اتصال به App.js
            onGameOver(score);
        }
    }, [tiles, score, onGameOver]);

    // Hook برای مدیریت ورودی کیبورد
    useEffect(() => {
        const handleKeyDown = (event) => {
            const map = {
                38: 0,
                39: 1,
                40: 2,
                37: 3,
                87: 0,
                68: 1,
                83: 2,
                65: 3,
            };
            if (map[event.keyCode] !== undefined) {
                event.preventDefault();
                move(map[event.keyCode]);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [move]);

    // Hook برای شروع بازی و چک کردن پایان آن
    useEffect(() => {
        restartGame();
    }, [restartGame]);

    useEffect(() => {
        if (tiles.length > 0) {
            checkGameOver();
        }
    }, [tiles, checkGameOver]);

    return (
        <div className="game-container" style={{ width: 500, height: 500 }}>
            <div className="game-header">
                <div className="score-container">Score: {score}</div>
                <div className="best-container">Best: {bestScore}</div>
            </div>
            <div className="grid-container">
                {grid.map((row, y) => (
                    <div className="grid-row" key={y}>
                        {row.map((_, x) => (
                            <div className="grid-cell" key={x}></div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="tile-container">
                {tiles.map((tile) => {
                    const classNames = [
                        "tile",
                        `tile-${tile.value}`,
                        `tile-position-${tile.x + 1}-${tile.y + 1}`,
                        tile.mergedFrom ? "tile-merged" : "",
                        tile.isNew ? "tile-new" : "",
                    ].join(" ");

                    return (
                        <div key={tile.id} className={classNames}>
                            <div className="tile-inner">{tile.value}</div>
                        </div>
                    );
                })}
            </div>
            {isGameOver && (
                <div className="game-message game-over">
                    <p>Game over!</p>
                    <div className="lower">
                        <a className="retry-button" onClick={restartGame}>
                            Try again
                        </a>
                    </div>
                </div>
            )}
            {won && !isGameOver && (
                <div className="game-message game-won">
                    <p>You win!</p>
                </div>
            )}
        </div>
    );
};

export default Game2048;
