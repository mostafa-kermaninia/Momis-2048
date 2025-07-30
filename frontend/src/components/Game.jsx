import React, { useState, useEffect, useMemo } from 'react';
import { GameManager } from '../gameLogic/game_manager';

// این سه کلاس به عنوان ورودی به GameManager داده می‌شوند
// و ارتباط بین منطق بازی و دنیای بیرون را برقرار می‌کنند

// 1. مدیریت ورودی (کیبورد) - این کلاس فقط یک بار در برنامه تعریف می‌شود
function KeyboardInputManager() {
  this.events = {};
  this.listen();
}
KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) this.events[event] = [];
  this.events[event].push(callback);
};
KeyboardInputManager.prototype.emit = function (event, data) {
  const callbacks = this.events[event];
  if (callbacks) callbacks.forEach(callback => callback(data));
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
  });
  // برای راحتی، می‌توانید دکمه ری‌استارت را هم به کیبورد اضافه کنید (مثلا 'R')
  document.addEventListener("keydown", event => {
      if (!modifiers && event.which === 82) {
          this.emit("restart");
      }
  });
};

// 2. مدیریت ذخیره‌سازی (localStorage) - این کلاس هم فقط یک بار تعریف می‌شود
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


const Game = ({ onGameOver, onExit }) => {
  const [gameState, setGameState] = useState(null);

  // 🔥 FIX: تعریف Actuator به عنوان یک Constructor که به state دسترسی دارد
  // این کار خطای 'n is not a constructor' را به طور کامل حل می‌کند
  const Actuator = useMemo(() => {
    return function Actuator() {
      this.actuate = (grid, metadata) => {
        setGameState({ grid, metadata });

        if (metadata.over && typeof onGameOver === 'function') {
          onGameOver(metadata.score);
        }
      };
      this.continueGame = () => {};
    };
  }, [onGameOver]);

  // ساخت یک نمونه از GameManager فقط یک بار در طول عمر کامپوننت
  const gameManager = useMemo(() => {
    return new GameManager(4, KeyboardInputManager, Actuator, LocalStorageManager);
  }, [Actuator]);

  useEffect(() => {
    // این اطمینان می‌دهد که بازی با اولین رندر شروع می‌شود
    if (!gameState) {
      gameManager.setup();
    }
  }, [gameManager, gameState]);


  if (!gameState) {
    return <div className="text-white">Loading Game...</div>;
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
        <button className="restart-button" onClick={() => gameManager.restart()}>New Game</button>
      </div>

      <div className="game-container">
        {metadata.terminated && (
          <div className="game-message game-over">
            <p>{metadata.won ? "You win!" : "Game Over!"}</p>
            <div className="lower">
              <button className="retry-button" onClick={() => gameManager.restart()}>Try again</button>
              {metadata.won && <button className="keep-playing-button" onClick={() => gameManager.keepPlaying()}>Keep going</button>}
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
            if (tile.mergedFrom) classList.push("tile-merged");
            if (tile.previousPosition) {
                // انیمیشن حرکت توسط کلاس position مدیریت می‌شود
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
      {onExit && <button onClick={onExit} className="exit-button">Back to Lobby</button>}
    </div>
  );
};

export default Game;