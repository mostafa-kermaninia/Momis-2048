import React from 'react';
import Tile from './Tile';

const Board = ({ tiles }) => {
  return (
    <div className="board-container">
      {/* لایه اول: گرید ثابت پس‌زمینه */}
      <div className="grid-background">
        {Array(16).fill(null).map((_, i) => (
          <div key={i} className="grid-cell" />
        ))}
      </div>

      {/* لایه دوم: کاشی‌های متحرک */}
      <div className="tile-container">
        {tiles.map(tile => {
          // استایل موقعیت‌یابی برای هر کاشی
          const style = {
            transform: `translate(calc(${tile.col} * (var(--cell-size) + var(--cell-gap))), calc(${tile.row} * (var(--cell-size) + var(--cell-gap))))`
          };
          
          return (
            <div key={tile.id} className="tile-wrapper" style={style}>
              <Tile 
                value={tile.value}
                isNew={tile.isNew}
                isMerged={tile.isMerged}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;