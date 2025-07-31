// ================================================================
//  منطق کامل و امن بازی 2048 برای استفاده در سمت سرور (نسخه اصلاح شده)
// ================================================================

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

/**
 * ✅ شبیه‌ساز امن و جدید بازی در سرور.
 * این تابع سناریوی کامل بازی (حرکات + کاشی‌های جدید) را دریافت کرده و امتیاز را بازسازی می‌کند.
 * @param {object} gameScenario - آبجکتی شامل حرکات و کاشی‌های جدید.
 * @param {string[]} gameScenario.moves - آرایه‌ای از حرکات مثل ['up', 'left', ...].
 * @param {object[]} gameScenario.newTiles - آرایه‌ای از کاشی‌های جدید تولید شده در کلاینت.
 * @returns {number} - امتیاز نهایی محاسبه شده و امن.
 */
function simulateGameAndGetScore(gameScenario) {
    const { moves, newTiles } = gameScenario;
    let grid = createEmptyGrid();
    let totalScore = 0;
    let tileIndex = 0; // شمارنده برای استفاده از آرایه newTiles

    // مرحله ۱: قرار دادن دو کاشی اولیه بر اساس سناریوی واقعی کاربر
    // بازی 2048 همیشه با دو کاشی شروع می‌شود
    for (let i = 0; i < 2; i++) {
        if (tileIndex < newTiles.length) {
            const tile = newTiles[tileIndex];
            grid[tile.position.y][tile.position.x] = { value: tile.value };
            tileIndex++;
        }
    }

    const directionMap = { left: 0, up: 1, right: 2, down: 3 };

    // مرحله ۲: اجرای حرکات و اضافه کردن کاشی‌های جدید بر اساس سناریو
    for (const moveString of moves) {
        const direction = directionMap[moveString];
        if (direction === undefined) continue;

        // اجرای حرکت
        const { newGrid, score } = move(grid, direction);
        totalScore += score;
        grid = newGrid;

        // اضافه کردن کاشی جدید بعدی از لیست ارسالی
        if (tileIndex < newTiles.length) {
            const tile = newTiles[tileIndex];
            // بررسی می‌کنیم که خانه مورد نظر خالی باشد (برای امنیت بیشتر)
            if (grid[tile.position.y][tile.position.x] === null) {
                grid[tile.position.y][tile.position.x] = { value: tile.value };
            } else {
                // اگر کلاینت داده اشتباه بفرستد، سرور متوجه می‌شود
                console.error(
                    `[SECURITY-VIOLATION] Client tried to place a tile on a non-empty cell. User might be cheating.`
                );
                // در این حالت می‌توان بازی را نامعتبر دانست و امتیاز صفر برگرداند
                return 0;
            }
            tileIndex++;
        }
    }

    // مرحله ۳: برگرداندن امتیاز نهایی محاسبه شده
    return totalScore;
}

// توابع را export می‌کنیم تا در فایل اصلی سرور (server.js) قابل استفاده باشند
module.exports = { simulateGameAndGetScore };
