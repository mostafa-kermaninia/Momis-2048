import React, { useEffect } from "react";
import "./Game.css"; // <<--- این خط جدید و بسیار مهم است
import { GameManager } from "../gameLogic/game_manager";
import { HTMLActuator } from "../gameLogic/html_actuator";

// کلاس‌های مدیریت ورودی و ذخیره‌سازی
function KeyboardInputManager() {
    this.events = {};
    this.listen();
}
KeyboardInputManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};
KeyboardInputManager.prototype.emit = function (event, data) {
    const callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach((c) => c(data));
    }
};
KeyboardInputManager.prototype.listen = function () {
    const map = {
        38: 0,
        39: 1,
        40: 2,
        37: 3,
        75: 0,
        76: 1,
        74: 2,
        72: 3,
        87: 0,
        68: 1,
        83: 2,
        65: 3,
    };
    document.addEventListener("keydown", (event) => {
        const modifiers =
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
        const mapped = map[event.which];
        if (!modifiers && mapped !== undefined) {
            event.preventDefault();
            this.emit("move", mapped);
        }
    });
};

function LocalStorageManager() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";
    this.storage = window.localStorage;
}
LocalStorageManager.prototype.getBestScore = function () {
    return this.storage.getItem(this.bestScoreKey) || 0;
};
LocalStorageManager.prototype.setBestScore = function (score) {
    this.storage.setItem(this.bestScoreKey, score);
};
LocalStorageManager.prototype.getGameState = function () {
    return JSON.parse(this.storage.getItem(this.gameStateKey));
};
LocalStorageManager.prototype.setGameState = function (state) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(state));
};
LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
};

const Game = ({ onGameOver, onExit }) => {
    useEffect(() => {
        // این کد فقط یک بار پس از رندر شدن کامپوننت اجرا می‌شود
        const gameManager = new GameManager(
            4,
            KeyboardInputManager,
            HTMLActuator,
            LocalStorageManager
        );

        // ما باید تابع onGameOver را به GameManager متصل کنیم
        // این کار را با بازنویسی تابع actuate انجام می‌دهیم
        const originalActuate = gameManager.actuator.actuate.bind(
            gameManager.actuator
        );
        gameManager.actuator.actuate = (grid, metadata) => {
            originalActuate(grid, metadata);
            if (metadata.over && typeof onGameOver === "function") {
                onGameOver(metadata.score);
            }
        };

        // اتصال دکمه‌های ری‌استارت به منطق بازی
        const restartButtons = document.querySelectorAll(
            ".retry-button, .restart-button"
        );
        restartButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                gameManager.restart();
            });
        });

        const keepPlayingButton = document.querySelector(
            ".keep-playing-button"
        );
        if (keepPlayingButton) {
            keepPlayingButton.addEventListener("click", (e) => {
                e.preventDefault();
                gameManager.keepPlaying();
            });
        }

        // این یک تابع cleanup است که هنگام unmount شدن کامپوننت اجرا می‌شود
        return () => {
            // اینجا می‌توانید event listener ها را حذف کنید اگر نیاز بود
        };
    }, [onGameOver]); // این effect فقط یک بار اجرا می‌شود

    // کامپوننت React فقط ساختار اولیه HTML را رندر می‌کند
    // و بقیه کارها توسط html_actuator.js انجام می‌شود
    return (
        <div className="game-root-2048">
            <div className="game-wrapper-2048">
                <div className="heading">
                    <h1 className="title">2048</h1>
                    <div className="scores-container">
                        <div className="score-container">0</div>
                        <div className="best-container">0</div>
                    </div>
                </div>

                <div className="above-game">
                    <p className="game-intro">
                        Join the numbers and get to the{" "}
                        <strong>2048 tile!</strong>
                    </p>
                    <button className="restart-button">New Game</button>
                </div>

                <div className="game-container">
                    <div className="game-message">
                        <p></p>
                        <div className="lower">
                            <button className="retry-button">Try again</button>
                            <button className="keep-playing-button">
                                Keep going
                            </button>
                        </div>
                    </div>

                    <div className="grid-container">
                        {Array(4)
                            .fill(null)
                            .map((_, i) => (
                                <div key={i} className="grid-row">
                                    {Array(4)
                                        .fill(null)
                                        .map((_, j) => (
                                            <div
                                                key={j}
                                                className="grid-cell"
                                            />
                                        ))}
                                </div>
                            ))}
                    </div>

                    <div className="tile-container"></div>
                </div>
                {onExit && (
                    <button onClick={onExit} className="exit-button">
                        Back to Lobby
                    </button>
                )}
            </div>
        </div>
    );
};

export default Game;
