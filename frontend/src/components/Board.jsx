import React from 'react';
import Tile from './Tile';

const Board = ({ tiles }) => {
  return (
    <div className="board-container">
      <div className="grid-background">
        {Array(16).fill(null).map((_, i) => <div key={i} className="grid-cell"></div>)}
      </div>

      <div className="tile-container">
        {tiles.map(tile => (
            // 🔥 FIX: کلاس grid-row/col برای موقعیت‌یابی دقیق
            <div 
                key={tile.id} 
                className="tile-wrapper" 
                style={{
                    gridRowStart: tile.row + 1,
                    gridColumnStart: tile.col + 1,
                }}
            >
                <Tile 
                  value={tile.value} 
                  isNew={tile.isNew} 
                  isMerged={tile.isMerged} 
                />
            </div>
        ))}
      </div>
    </div>
  );
};

export default Board;