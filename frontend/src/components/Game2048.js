import React, { useState, useEffect, useCallback } from "react";
import "./Game2048.css";

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
const addRandomTile = (grid) => {
    const newGrid = grid.map((row) => [...row]);
    const cell = getRandomAvailableCell(newGrid);
    let newTileData = null;
    if (cell) {
        const value = Math.random() < 0.9 ? 2 : 4;
        newGrid[cell.y][cell.x] = {
            value,
            id: Date.now() + Math.random(),
            isNew: true,
        };
        // ✨ آبجکت ساده و تمیز برای ارسال به سرور
        newTileData = { value, x: cell.x, y: cell.y };
    }
    return { grid: newGrid, newTileData };
};
const movesAvailable = (g) => {
    for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
            const c = g[y][x];
            if (!c) return true;
            if (x < 3 && c.value === g[y][x + 1]?.value) return true;
            if (y < 3 && c.value === g[y + 1][x]?.value) return true;
        }
    return false;
};
const slide = (r) => {
    const a = r.filter((v) => v),
        m = 4 - a.length,
        z = Array(m).fill(null);
    return a.concat(z);
};
const combine = (row) => {
    let scoreToAdd = 0;
    for (let i = 0; i < 3; i++) {
        if (row[i] && row[i].value === row[i + 1]?.value) {
            scoreToAdd += row[i].value * 2;
            row[i] = {
                ...row[i],
                value: row[i].value * 2,
                isMerged: true,
                id: Date.now() + Math.random(),
            };
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
            r.map((c) => (c ? { ...c, isNew: false, isMerged: false } : null))
        ),
        s = 0,
        m = false;
    const H = d === 0 || d === 2,
        R = d === 2 || d === 3;
    if (!H) G = transposeGrid(G);
    for (let y = 0; y < 4; y++) {
        const O = [...G[y]];
        let r = [...O];
        if (R) r.reverse();
        const S = slide(r),
            { newRow: N, score: C } = combine(S);
        let F = slide(N);
        s += C;
        if (R) F.reverse();
        G[y] = F;
        for (let x = 0; x < 4; x++) if (O[x]?.id !== F[x]?.id) m = true;
    }
    if (!H) G = transposeGrid(G);
    return { newGrid: G, score: s, moved: m };
};

// The Component with the final fix
const Game2048 = ({ onGameOver, onGoHome, initialBestScore, eventId }) => {
    const [grid, setGrid] = useState(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(initialBestScore || 0);
    const [isGameOver, setGameOver] = useState(false);

    // ✨ **THE FIX**: Use separate, reliable states instead of a single scenario object
    const [moves, setMoves] = useState([]);
    const [allNewTiles, setAllNewTiles] = useState([]);

    useEffect(() => {
        setBestScore(initialBestScore || 0);
    }, [initialBestScore]);

    const setupGame = useCallback(() => {
        let tempGrid = createEmptyGrid();
        const firstTileResult = addRandomTile(tempGrid);
        tempGrid = firstTileResult.grid;
        const secondTileResult = addRandomTile(tempGrid);

        setGrid(secondTileResult.grid);
        setScore(0);
        setGameOver(false);

        // ✨ Initialize the new states correctly
        setMoves([]);
        setAllNewTiles(
            [firstTileResult.newTileData, secondTileResult.newTileData].filter(
                Boolean
            )
        );
    }, []);

    useEffect(() => {
        setupGame();
    }, [setupGame]);

    const processMove = useCallback(
        (direction) => {
            if (isGameOver) return;

            const { newGrid, score: newScore, moved } = move(grid, direction);

            if (moved) {
                const { grid: gridWithNewTile, newTileData } =
                    addRandomTile(newGrid);
                const updatedScore = score + newScore;

                setGrid(gridWithNewTile);
                setScore(updatedScore);

                if (updatedScore > bestScore) {
                    setBestScore(updatedScore);
                }

                // ✨ Use functional updates to prevent stale state
                const directionMap = {
                    0: "left",
                    1: "up",
                    2: "right",
                    3: "down",
                };
                const newMove = directionMap[direction];

                setMoves((prevMoves) => [...prevMoves, newMove]);
                setAllNewTiles((prevTiles) =>
                    [...prevTiles, newTileData].filter(Boolean)
                );

                if (!movesAvailable(gridWithNewTile)) {
                    setGameOver(true);
                    // ✨ Construct the final scenario object on the fly with the latest data
                    onGameOver(updatedScore, {
                        moves: [...moves, newMove],
                        newTiles: [...allNewTiles, newTileData].filter(Boolean),
                    });
                }
            }
        },
        [
            grid,
            score,
            bestScore,
            isGameOver,
            onGameOver,
            moves,
            allNewTiles,
        ]
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
                processMove(direction);
            }
        },
        [processMove]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    const tiles = grid
        .flatMap((row, y) =>
            row.map((cell, x) => (cell ? { ...cell, x, y } : null))
        )
        .filter(Boolean);
    return (
        // ... Your JSX remains unchanged ...
        <div className="game-wrapper">
            <div className="game-header">
                <h1 className="title">MOMIS 2048</h1>
                <div className="scores-container">
                    <div className="score-box">
                        <span className="score-label">SCORE</span>
                        {score}
                    </div>
                </div>
            </div>
            <div className="above-game">
                <button className="game-button" onClick={setupGame}>
                    New Game
                </button>
                <button className="game-button" onClick={onGoHome}>
                    Home
                </button>
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
                            }-${tile.y + 1} ${tile.isNew ? "tile-new" : ""}`}
                        >
                            <div className="tile-inner">{tile.value}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="dpad-controls">
                <div className="dpad-row">
                    <button
                        className="dpad-button"
                        onClick={() => processMove(1)}
                    >
                        ▲
                    </button>
                </div>
                <div className="dpad-row">
                    <button
                        className="dpad-button"
                        onClick={() => processMove(0)}
                    >
                        ◄
                    </button>
                    <div className="dpad-center"></div>
                    <button
                        className="dpad-button"
                        onClick={() => processMove(2)}
                    >
                        ►
                    </button>
                </div>
                <div className="dpad-row">
                    <button
                        className="dpad-button"
                        onClick={() => processMove(3)}
                    >
                        ▼
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Game2048;
