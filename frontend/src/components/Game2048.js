import React, { useState, useEffect, useCallback } from "react";
import "./Game2048.css";

const localStorageManager = {
    getBestScore: (eventId) => {
        const key = eventId ? `bestScore_${eventId}` : "bestScore_freeplay";
        return parseInt(window.localStorage.getItem(key) || "0", 10);
    },
    setBestScore: (score, eventId) => {
        const key = eventId ? `bestScore_${eventId}` : "bestScore_freeplay";
        window.localStorage.setItem(key, score);
    },
};

const createEmptyGrid = () =>
    Array.from({ length: 4 }, () => Array(4).fill(null));
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
        return availableCells[
            Math.floor(Math.random() * availableCells.length)
        ];
    }
    return null;
};

// ✨ تابع افزودن کاشی حالا خود کاشی را هم برمی‌گرداند تا بتوانیم آن را ثبت کنیم
const addRandomTile = (grid) => {
    const newGrid = grid.map((row) => [...row]);
    const cell = getRandomAvailableCell(newGrid);
    let newTile = null;
    if (cell) {
        const value = Math.random() < 0.9 ? 2 : 4;
        newTile = { value, ...cell }; // کاشی جدید با مقدار و موقعیت
        newGrid[cell.y][cell.x] = {
            value,
            id: Date.now() + Math.random(),
            isNew: true,
        };
    }
    return { grid: newGrid, newTile };
};

// ... (توابع movesAvailable, slide, combine, transposeGrid, move بدون تغییر باقی می‌مانند)
const movesAvailable = (g) => {
    for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
            const c = g[y][x];
            if (!c) return !0;
            if (x < 3 && c.value === g[y][x + 1]?.value) return !0;
            if (y < 3 && c.value === g[y + 1][x]?.value) return !0;
        }
    return !1;
};
const slide = (r) => {
    const a = r.filter((v) => v),
        m = 4 - a.length,
        z = Array(m).fill(null);
    return a.concat(z);
};
// کد اصلاح‌شده و صحیح
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
const transposeGrid = (g) => {
    const n = createEmptyGrid();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) n[x][y] = g[y][x];
    return n;
};
const move = (g, d) => {
    let G = g.map((r) =>
            r.map((c) => (c ? { ...c, isNew: !1, isMerged: !1 } : null))
        ),
        s = 0,
        m = !1;
    const H = d === 0 || d === 2,
        R = d === 2 || d === 3;
    H || (G = transposeGrid(G));
    for (let y = 0; y < 4; y++) {
        const O = [...G[y]];
        let r = [...O];
        R && r.reverse();
        const S = slide(r),
            { newRow: N, score: C } = combine(S);
        let F = slide(N);
        s += C;
        R && F.reverse();
        G[y] = F;
        for (let x = 0; x < 4; x++) O[x]?.value !== F[x]?.value && (m = !0);
    }
    H || (G = transposeGrid(G));
    return { newGrid: G, score: s, moved: m };
};

const Game2048 = ({ onGameOver, onGoHome, eventId }) => {
    const [grid, setGrid] = useState(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() =>
        localStorageManager.getBestScore(eventId)
    );
    const [isGameOver, setGameOver] = useState(false);

    // ✨ مرحله ۱: ساختار داده جدید برای سناریوی کامل بازی
    const [gameScenario, setGameScenario] = useState({
        initialTiles: [], // دو کاشی اول
        moves: [], // تاریخچه حرکات
        newTiles: [], // کاشی‌های جدیدی که بعد از هر حرکت اضافه می‌شوند
    });

    useEffect(() => {
        setBestScore(localStorageManager.getBestScore(eventId));
    }, [eventId]);

    const setupGame = useCallback(() => {
        let tempGrid = createEmptyGrid();
        const firstTileResult = addRandomTile(tempGrid);
        tempGrid = firstTileResult.grid;
        const secondTileResult = addRandomTile(tempGrid);

        setGrid(secondTileResult.grid);
        setScore(0);
        setGameOver(false);

        // ✨ مرحله ۲: ثبت سناریوی اولیه بازی
        setGameScenario({
            initialTiles: [firstTileResult.newTile, secondTileResult.newTile],
            moves: [],
            newTiles: [],
        });
    }, []);

    useEffect(() => {
        setupGame();
    }, [setupGame]);

    const processMove = useCallback(
        (direction) => {
            if (isGameOver) return;

            const { newGrid, score: newScore, moved } = move(grid, direction);

            if (moved) {
                const { grid: gridWithNewTile, newTile } =
                    addRandomTile(newGrid);

                const directionMap = {
                    0: "left",
                    1: "up",
                    2: "right",
                    3: "down",
                };
                const moveName = directionMap[direction];

                // Use functional updates to avoid stale state
                const updatedScore = score + newScore;
                setScore(updatedScore);
                setGrid(gridWithNewTile);

                const updatedScenario = {
                    ...gameScenario,
                    moves: [...gameScenario.moves, moveName],
                    newTiles: [...gameScenario.newTiles, newTile],
                };
                setGameScenario(updatedScenario);

                if (updatedScore > bestScore) {
                    setBestScore(updatedScore);
                    localStorageManager.setBestScore(updatedScore, eventId);
                }

                if (!movesAvailable(gridWithNewTile)) {
                    setGameOver(true);
                    onGameOver(updatedScore, updatedScenario);
                }
            }
        },
        [grid, score, bestScore, isGameOver, onGameOver, eventId, gameScenario] // Dependencies are kept for now, but functional updates are safer.
    );

    const handleKeyDown = useCallback(
        (e) => {
            const directionMap = {
                ArrowLeft: 0,
                ArrowUp: 1,
                ArrowRight: 2,
                ArrowDown: 3,
            };

            const direction = directionMap[e.key];

            if (direction !== undefined) {
                e.preventDefault();
                // ✅ FIX 2: Call `processMove`, not the utility `move` function
                processMove(direction);
            }
        },
        [processMove] // Dependency is correct now
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    // ... JSX شما بدون تغییر باقی می‌ماند ...
    const tiles = grid
        .flatMap((row, y) =>
            row.map((cell, x) => (cell ? { ...cell, x, y } : null))
        )
        .filter(Boolean);
    return (
        <div className="game-wrapper">
            <div className="game-header">
                <h1 className="title">MOMIS 2048</h1>
                <div className="scores-container">
                    <div className="score-box">
                        <span className="score-label">SCORE</span>
                        {score}
                    </div>
                    <div className="score-box">
                        <span className="score-label">BEST</span>
                        {bestScore}
                    </div>
                </div>
            </div>
            <div className="above-game">
                <a className="game-button" onClick={setupGame}>
                    New Game
                </a>
                <a className="game-button" onClick={onGoHome}>
                    Home
                </a>
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
                    {tiles.map((tile) => (
                        <div
                            key={tile.id}
                            className={`tile tile-${tile.value} tile-position-${
                                tile.x + 1
                            }-${tile.y + 1}`}
                        >
                            <div className="tile-inner">{tile.value}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="controls-container">
                <div className="controls-row">
                    <button
                        className="control-button"
                        onClick={() => processMove(1)}
                    >
                        ▲
                    </button>
                </div>
                <div className="controls-row">
                    <button
                        className="control-button"
                        onClick={() => processMove(0)}
                    >
                        ◄
                    </button>
                    <button
                        className="control-button"
                        onClick={() => processMove(3)}
                    >
                        ▼
                    </button>
                    <button
                        className="control-button"
                        onClick={() => processMove(2)}
                    >
                        ►
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Game2048;
