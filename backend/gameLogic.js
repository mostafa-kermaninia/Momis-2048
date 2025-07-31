// ================================================================
// منطق کامل بازی 2048 برای استفاده در سمت سرور
// ================================================================

// این توابع کپی دقیقی از منطق کلاینت هستند
const createEmptyGrid = () => Array.from({ length: 4 }, () => Array(4).fill(null));

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
            row[i] = { value: row[i].value * 2 }; // در سرور به id و ... نیازی نداریم
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
    let currentGrid = grid.map(r => r.map(c => c ? {...c} : null));
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
 * شبیه‌ساز اصلی بازی در سرور.
 * این تابع تاریخچه حرکات را دریافت کرده و امتیاز نهایی را محاسبه می‌کند.
 * @param {string[]} moveHistory - آرایه‌ای از حرکات مثل ['up', 'left', ...].
 * @returns {number} - امتیاز نهایی محاسبه شده توسط سرور.
 */
function simulateGameAndGetScore(moveHistory) {
    let grid = createEmptyGrid();
    let totalScore = 0;

    // بازی با دو کاشی تصادفی شروع می‌شود
    // برای سادگی، ما مکان‌ها و مقادیر ثابتی را برای شروع در نظر می‌گیریم.
    // این کار جلوی تقلب در شروع بازی را می‌گیرد.
    grid[0][0] = { value: 2 };
    grid[0][1] = { value: 2 };

    const directionMap = { 'left': 0, 'up': 1, 'right': 2, 'down': 3 };

    for (const moveString of moveHistory) {
        const direction = directionMap[moveString];
        if (direction === undefined) continue; // نادیده گرفتن حرکت نامعتبر

        const { newGrid, score } = move(grid, direction);
        totalScore += score;
        grid = newGrid;

        // بعد از هر حرکت، یک کاشی جدید اضافه می‌کنیم
        const availableCells = [];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (!grid[y][x]) {
                    availableCells.push({ x, y });
                }
            }
        }

        if (availableCells.length > 0) {
            // برای امنیت، همیشه کاشی "2" را در اولین خانه خالی اضافه می‌کنیم.
            // این باعث می‌شود نتیجه شبیه‌سازی همیشه قطعی باشد.
            const cell = availableCells[0]; 
            grid[cell.y][cell.x] = { value: 2 };
        }
    }

    return totalScore;
}


// توابع را export می‌کنیم تا در فایل اصلی قابل استفاده باشند
module.exports = { simulateGameAndGetScore };