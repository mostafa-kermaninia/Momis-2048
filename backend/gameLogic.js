// توابع پایه‌ای بازی (بدون تغییر)
const createEmptyGrid = () =>
    Array.from({ length: 4 }, () => Array(4).fill(null));

const slide = (row) => {
    const arr = row.filter((val) => val);
    const missing = 4 - arr.length;
    const zeros = Array(missing).fill(null);
    return arr.concat(zeros);
};

const combine = (row) => {
    let scoreToAdd = 0;
    for (let i = 0; i < 3; i++) {
        if (row[i] && row[i].value === row[i + 1]?.value) {
            scoreToAdd += row[i].value * 2;
            row[i] = { value: row[i].value * 2 };
            row[i + 1] = null;
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
    let currentGrid = grid.map((r) => r.map((c) => (c ? { ...c } : null)));
    let score = 0;

    const isHorizontal = direction === 0 || direction === 2; // 0: left, 2: right
    const isReversed = direction === 2 || direction === 3; // 2: right, 3: down

    if (!isHorizontal) currentGrid = transposeGrid(currentGrid);

    for (let y = 0; y < 4; y++) {
        let row = [...currentGrid[y]];
        if (isReversed) row.reverse();

        const slidRow = slide(row);
        const { newRow, score: newScore } = combine(slidRow);
        let finalRow = slide(newRow);

        score += newScore;

        if (isReversed) finalRow.reverse();
        currentGrid[y] = finalRow;
    }

    if (!isHorizontal) currentGrid = transposeGrid(currentGrid);

    return { newGrid: currentGrid, score };
};

// ✨ تابع کمکی برای چاپ کردن grid در کنسول
const printGrid = (grid) => {
    console.log("--------------------");
    grid.forEach((row) => {
        console.log(row.map((cell) => (cell ? cell.value : 0)).join("\t"));
    });
    console.log("--------------------");
};

function simulateGameAndGetScore(gameScenario) {
    const { moves, initialTiles, newTiles: moveTiles } = gameScenario;
    const allTiles = [...(initialTiles || []), ...(moveTiles || [])].filter(
        Boolean
    );

    let grid = createEmptyGrid();
    let totalScore = 0;
    let tileIndex = 0;
    const directionMap = { left: 0, up: 1, right: 2, down: 3 };

    console.log("\n\n====== SIMULATION STARTED ======");
    console.log(
        `Total moves: ${moves.length}, Total tiles: ${allTiles.length}`
    );

    // مرحله ۱: قرار دادن کاشی‌های اولیه
    for (let i = 0; i < 2; i++) {
        if (tileIndex < allTiles.length) {
            const tile = allTiles[tileIndex];
            if (tile && tile.position) {
                grid[tile.position.y][tile.position.x] = { value: tile.value };
            }
            tileIndex++;
        }
    }

    console.log("--- Initial Grid State ---");
    grid.forEach((row) => {
        console.log(row.map((cell) => (cell ? cell.value : "-")).join("\t"));
    });
    console.log("--------------------------");

    // مرحله ۲: اجرای حرکات
    for (let i = 0; i < moves.length; i++) {
        const moveString = moves[i];
        const direction = directionMap[moveString];

        console.log(`\n[Move #${i + 1}/${moves.length}: '${moveString}']`);

        if (direction === undefined) continue;

        const { newGrid, score } = move(grid, direction);

        // ✨ این مهم‌ترین لاگ است ✨
        console.log(
            `--> Score from this move: ${score}. Total score before adding: ${totalScore}`
        );

        totalScore += score;
        grid = newGrid;

        if (tileIndex < allTiles.length) {
            const tile = allTiles[tileIndex];
            if (
                tile &&
                tile.position &&
                grid[tile.position.y][tile.position.x] === null
            ) {
                grid[tile.position.y][tile.position.x] = { value: tile.value };
            }
            tileIndex++;
        }
    }

    console.log("\n====== SIMULATION FINISHED ======");
    console.log(`FINAL CALCULATED SCORE: ${totalScore}`);
    return totalScore;
}

module.exports = { simulateGameAndGetScore };
