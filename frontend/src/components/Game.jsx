import React, { useState, useEffect, useMemo } from 'react';
import { GameManager } from '../gameLogic/game_manager';

// این سه کلاس به عنوان ورودی به GameManager داده می‌شوند
// و ارتباط بین منطق بازی و دنیای بیرون را برقرار می‌کنند

// 1. مدیریت ورودی (کیبورد)
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
    callbacks.forEach(callback => callback(data));
  }
};
KeyboardInputManager.prototype.listen = function () {
  const map = { 38: 0, 39: 1, 40: 2, 37: 3, 75: 0, 76: 1, 74: 2, 72: 3, 87: 0, 68: 1, 83: 2, 65: 3 };
  document.addEventListener("keydown", event => {
    const modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    const mapped = map[event.which];
    if (!modifiers && mapped !== undefined) {
      event.preventDefault();
      this.emit("move", mapped);
    }
    if (!modifiers && event.which === 82) { // R for restart
        this.emit("restart");
    }
  });
};

// 2. مدیریت ذخیره‌سازی (در localStorage)
function LocalStorageManager() {
  this.bestScoreKey = "bestScore";
  this.gameStateKey = "gameState";
  this.storage = window.localStorage;
}
LocalStorageManager.prototype.getBestScore = function () { return this.storage.getItem(this.bestScoreKey) || 0; };
LocalStorageManager.prototype.setBestScore = function (score) { this.storage.setItem(this.bestScoreKey, score); };
LocalStorageManager.prototype.getGameState = function () {
  const stateJSON = this.storage.getItem(this.gameStateKey);
  return stateJSON ? JSON.parse(stateJSON) : null;
};
LocalStorageManager.prototype.setGameState = function (gameState) { this.storage.setItem(this.gameStateKey, JSON.stringify(gameState)); };
LocalStorageManager.prototype.clearGameState = function () { this.storage.removeItem(this.gameStateKey); };


const Game = ({ onGameOver }) => {
  const [gameState, setGameState] = useState(null);

  // 3. مدیریت نمایش (Actuator)
  // این کلاس مسئول است که به کامپوننت React بگوید چه زمانی باید رندر مجدد شود
  const actuator = useMemo(() => ({
    actuate: (grid, metadata) => {
      // وقتی منطق بازی این تابع را صدا می‌زند، ما state کامپوننت را آپدیت می‌کنیم
      // و این باعث رندر مجدد و نمایش تغییرات می‌شود
      setGameState({ grid, metadata });

      if(metadata.over && typeof onGameOver === 'function') {
        onGameOver(metadata.score);
      }
    },
    continueGame: () => {} // در این ساختار، این تابع کاری انجام نمی‌دهد
  }), [onGameOver]);
  
  // ساخت یک نمونه از GameManager فقط یک بار
  const gameManager = useMemo(() => {
    return new GameManager(4, KeyboardInputManager, actuator, LocalStorageManager);
  }, [actuator]);

  useEffect(() => {
    // برای اطمینان از اینکه event listener کیبورد فقط یک بار ثبت می‌شود
    // ما آن را درون GameManager مدیریت می‌کنیم
  }, [gameManager]);


  if (!gameState) {
    return <div>Loading...</div>;
  }
  
  const { grid, metadata } = gameState;

  return (
    <div className="container">
      <div className="heading">
        <h1 className="title">2048</h1>
        <div className="scores-container">
          <div className="score-container">{metadata.score}</div>
          <div className="best-container">{metadata.bestScore}</div>
        </div>
      </div>

      <div className="above-game">
        <p className="game-intro">Join the numbers and get to the <strong>2048 tile!</strong></p>
        <a className="restart-button" onClick={() => gameManager.restart()}>New Game</a>
      </div>

      <div className="game-container">
        {metadata.over && (
          <div className="game-message game-over">
            <p>Game Over!</p>
            <div className="lower">
              <a className="retry-button" onClick={() => gameManager.restart()}>Try again</a>
            </div>
          </div>
        )}
        {metadata.won && !metadata.over && (
            <div className="game-message game-won">
                <p>You win!</p>
                <div className="lower">
                    <a className="keep-playing-button" onClick={() => gameManager.keepPlaying()}>Keep going</a>
                    <a className="retry-button" onClick={() => gameManager.restart()}>Try again</a>
                </div>
            </div>
        )}

        <div className="grid-container">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="grid-row">
              {Array(4).fill(null).map((_, j) => <div key={j} className="grid-cell" />)}
            </div>
          ))}
        </div>

        <div className="tile-container">
          {grid.cells.flat().filter(tile => tile).map(tile => {
            const classList = ["tile", `tile-${tile.value}`, `tile-position-${tile.x + 1}-${tile.y + 1}`];
            if (tile.mergedFrom) {
                classList.push("tile-merged");
            }
            if (tile.previousPosition) {
                 // این باعث انیمیشن حرکت می‌شود (در CSS تعریف شده)
            } else {
                classList.push("tile-new");
            }

            return (
              <div key={tile.x * 4 + tile.y} className={classList.join(" ")}>
                <div className="tile-inner">{tile.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Game;