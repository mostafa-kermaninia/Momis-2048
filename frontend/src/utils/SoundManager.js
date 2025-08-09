// src/utils/SoundManager.js

// --- وارد کردن فایل‌های صوتی ---
import moveSoundSrc from '../assets/sounds/move.mp3';
import mergeSoundSrc from '../assets/sounds/merge.mp3';
import gameOverSoundSrc from '../assets/sounds/gameOver.mp3';
import lobbyMusicSrc from '../assets/sounds/lobby_music.mp3';
import gameMusicSrc from '../assets/sounds/game_music.mp3';

// --- تعریف آبجکت‌های Audio ---
const sfx = {
    move: new Audio(moveSoundSrc),
    merge: new Audio(mergeSoundSrc),
    gameOver: new Audio(gameOverSoundSrc),
};

const music = {
    lobby: new Audio(lobbyMusicSrc),
    game: new Audio(gameMusicSrc),
};

// --- تنظیمات اولیه ---
let isMuted = false;
let currentMusic = null;

// تنظیم ولوم و قابلیت تکرار برای موسیقی
Object.values(music).forEach(track => {
    track.loop = true; // موسیقی تکرار شود
    track.volume = 0.3; // ولوم کمتر برای موسیقی پس‌زمینه
});

// تنظیم ولوم برای افکت‌های صوتی
Object.values(sfx).forEach(sound => {
    sound.volume = 0.6;
});

// --- توابع قابل Export ---

/**
 * یک افکت صوتی را پخش می‌کند
 * @param {'move' | 'merge' | 'gameOver'} soundName
 */
export const playSound = (soundName) => {
    if (isMuted) return;
    const sound = sfx[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {}); // خطاها را نادیده می‌گیریم
    }
};

/**
 * موسیقی پس‌زمینه را پخش می‌کند و بین ترک‌ها جابجا می‌شود
 * @param {'lobby' | 'game' | null} trackName - نام موسیقی یا null برای توقف
 */
export const playMusic = (trackName) => {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }

    if (trackName && music[trackName]) {
        currentMusic = music[trackName];
        if (!isMuted) {
            currentMusic.play().catch(() => {});
        }
    } else {
        currentMusic = null;
    }
};

/**
 * کل صداها (موسیقی و افکت) را قطع یا وصل می‌کند
 */
export const toggleMute = () => {
    isMuted = !isMuted;
    if (isMuted) {
        if (currentMusic) currentMusic.pause();
    } else {
        if (currentMusic) currentMusic.play().catch(() => {});
    }
    return isMuted; // وضعیت جدید را برمی‌گرداند
};