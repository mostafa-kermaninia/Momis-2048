class SeededRandom {
    constructor(seed) {
        this.seed = typeof seed === 'number' && seed !== 0 ? seed : 12345;
    }

    next() {
        const a = 1664525;
        const c = 1013904223;
        const m = 2**32; 
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }
}


module.exports = { SeededRandom };