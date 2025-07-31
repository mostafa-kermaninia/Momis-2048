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
            // آبجکت کامل را حفظ می‌کنیم، دقیقاً مثل کلاینت
            row[i] = { ...row[i], value: row[i].value * 2, isMerged: true };
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

const move = (g, d) => {
    let G = g.map((r) =>
        r.map((c) => (c ? { ...c, isNew: false, isMerged: false } : null))
    );
    let s = 0;
    let m = false; // moved flag
    const H = d === 0 || d === 2;
    const R = d === 2 || d === 3;
    if (!H) G = transposeGrid(G);
    for (let y = 0; y < 4; y++) {
        const O = [...G[y]];
        let r = [...O];
        if (R) r.reverse();
        const S = slide(r);
        const { newRow: N, score: C } = combine(S);
        let F = slide(N);
        s += C;
        if (R) F.reverse();
        G[y] = F;
        for (let x = 0; x < 4; x++) {
            if (O[x]?.value !== F[x]?.value) {
                m = true;
            }
        }
    }
    if (!H) G = transposeGrid(G);
    return { newGrid: G, score: s, moved: m };
};

function simulateGameAndGetScore(gameScenario) {
    // از gameScenario فقط `moves` و `newTiles` (که شامل همه کاشی‌هاست) را می‌خوانیم
    const { moves, newTiles } = gameScenario;
    if (!moves || !newTiles) return 0; // بررسی امنیتی

    let grid = createEmptyGrid();
    let totalScore = 0;
    let tileIndex = 0;
    const directionMap = { left: 0, up: 1, right: 2, down: 3 };

    // مرحله ۱: قرار دادن دو کاشی اولیه
    for (let i = 0; i < 2; i++) {
        if (tileIndex < newTiles.length) {
            const tile = newTiles[tileIndex];
            if (tile && tile.position) {
                grid[tile.position.y][tile.position.x] = {
                    value: tile.value,
                    id: Math.random(),
                };
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
    for (const moveString of moves) {
        const direction = directionMap[moveString];
        if (direction === undefined) continue;

        const { newGrid, score, moved } = move(grid, direction);

        // ✨ این شرط حیاتی‌ترین بخش اصلاحات است ✨
        // فقط در صورتی که حرکتی انجام شده باشد، امتیاز اضافه شده و کاشی جدید قرار می‌گیرد
        if (moved) {
            totalScore += score;
            grid = newGrid;

            if (tileIndex < newTiles.length) {
                const tile = newTiles[tileIndex];
                if (
                    tile &&
                    tile.position &&
                    grid[tile.position.y][tile.position.x] === null
                ) {
                    grid[tile.position.y][tile.position.x] = {
                        value: tile.value,
                        id: Math.random(),
                    };
                }
                tileIndex++;
            }
        }
    }

    console.log("\n====== SIMULATION FINISHED ======");
    console.log(`FINAL CALCULATED SCORE: ${totalScore}`);
    return totalScore;
}

module.exports = { simulateGameAndGetScore };
