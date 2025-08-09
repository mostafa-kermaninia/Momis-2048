// src/utils/SoundManager.js

import moveSoundSrc from '../assets/sounds/move.mp3';
import mergeSoundSrc from '../assets/sounds/merge.mp3';
import gameOverSoundSrc from '../assets/sounds/gameOver.mp3';

// یک آبجکت برای نگهداری تمام آبجکت‌های Audio
const sounds = {
    move: new Audio(moveSoundSrc),
    merge: new Audio(mergeSoundSrc),
    gameOver: new Audio(gameOverSoundSrc),
};

// تنظیم اولیه صداها
Object.values(sounds).forEach(sound => {
    sound.volume = 0.5; // می‌توانید ولوم پیش‌فرض را اینجا تغییر دهید
});

/**
 * یک صدا را بر اساس نام آن پخش می‌کند
 * @param {('move' | 'merge' | 'gameOver')} soundName - نام صدایی که باید پخش شود
 */
export const playSound = (soundName) => {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0; // صدا را از ابتدا پخش می‌کند
        sound.play().catch(error => {
            // خطای مربوط به نیاز به تعامل کاربر معمولاً در اینجا رخ می‌دهد
            // console.error(`Could not play sound: ${soundName}`, error);
        });
    }
};