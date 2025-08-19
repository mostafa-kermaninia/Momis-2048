const { SeededRandom } = require('./SeededRandom');

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

const getRandomAvailableCell = (grid, seededRandom) => {
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
            Math.floor(seededRandom.next() * availableCells.length)
        ];
    }
    return null;
};

const addRandomTile = (grid, seededRandom) => {
    const newGrid = grid.map((row) => [...row]);
    const cell = getRandomAvailableCell(newGrid, seededRandom);
    let newTileData = null;
    if (cell) {
        const value = seededRandom.next() < 0.9 ? 2 : 4;
        newGrid[cell.y][cell.x] = {
            value,
            id: Date.now() + seededRandom.next(),
            isNew: true,
        };
        newTileData = { value, x: cell.x, y: cell.y };
    }
    return { grid: newGrid, newTileData };
};

function simulateGameAndGetScore(gameScenario, seed) {
    const { moves, newTiles } = gameScenario;
    const seededRandom = new SeededRandom(seed);

    if (!moves || !newTiles) {
        return -1; // اگر داده‌ها ناقص باشند
    }

    // مرحله ۱: تولید و اعتبارسنجی دو کاشی اولیه
    let grid = createEmptyGrid();
    for (let i = 0; i < 2; i++) {
        // تولید کاشی جدید توسط بک‌اند
        const { grid: updatedGrid, newTileData: generatedTile } = addRandomTile(grid, seededRandom);
        
        // اعتبارسنجی کاشی تولیدشده با کاشی ارسالی از فرانت
        const sentTile = newTiles[i];
        if (!sentTile || sentTile.x !== generatedTile.x || sentTile.y !== generatedTile.y || sentTile.value !== generatedTile.value) {
            console.error(`Mismatch on initial tile ${i}: Sent: ${JSON.stringify(sentTile)}, Generated: ${JSON.stringify(generatedTile)}`);
            return -1;
        }
        grid = updatedGrid;
    }

    let totalScore = 0;
    const directionMap = { left: 0, up: 1, right: 2, down: 3 };
    let tileIndex = 2; // شروع از کاشی سوم

    // مرحله ۲: شبیه‌سازی و اعتبارسنجی حرکات
    for (const moveString of moves) {
        const direction = directionMap[moveString];
        if (typeof direction === "undefined") continue;

        const { newGrid, score, moved } = move(grid, direction);

        if (moved) {
            totalScore += score;
            
            // تولید کاشی جدید توسط بک‌اند پس از یک حرکت معتبر
            const { grid: updatedGrid, newTileData: generatedTile } = addRandomTile(newGrid, seededRandom);

            // اعتبارسنجی کاشی تولیدشده با کاشی ارسالی از فرانت
            const sentTile = newTiles[tileIndex];
            if (!sentTile || sentTile.x !== generatedTile.x || sentTile.y !== generatedTile.y || sentTile.value !== generatedTile.value) {
                console.error(`Mismatch on move ${tileIndex - 2}: Sent: ${JSON.stringify(sentTile)}, Generated: ${JSON.stringify(generatedTile)}`);
                return -1;
            }
            grid = updatedGrid;
            tileIndex++;
        } else {
            // اگر حرکت معتبر نباشد (گرید تغییر نکند)، نباید کاشی جدیدی اضافه شود.
            // در این حالت، داده‌های فرانت نیز نباید کاشی جدیدی داشته باشند.
            // اگر فرانت یک کاشی جدید اضافه کرده باشد، این حرکت نامعتبر است.
            if (newTiles.length > tileIndex) {
                 return -1;
            }
        }
    }

    // مرحله ۳: بررسی تعداد کاشی‌ها و نمره نهایی
    // بررسی می‌کنیم که آیا تعداد کاشی‌های تولید شده با تعداد ارسالی مطابقت دارد
    if (tileIndex !== newTiles.length) {
        console.error("Mismatch in number of tiles.");
        return -1;
    }
    
    // در نهایت، نمره نهایی شبیه‌سازی‌شده را برمی‌گردانیم
    return totalScore;
}

module.exports = { simulateGameAndGetScore };
