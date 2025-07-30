import React from 'react';

// کامپوننت Tile نیازی به تغییر ندارد و همان کد قبلی صحیح است.
import Tile from './Tile';

const Board = ({ tiles }) => {
  return (
    <div className="board-container-2048">
      {/* لایه اول: گرید ثابت پس‌زمینه */}
      <div className="grid-background-2048">
        {Array(16).fill(null).map((_, i) => (
          <div key={i} className="grid-cell-2048" />
        ))}
      </div>

      {/* لایه دوم: کاشی‌های متحرک */}
      <div className="tile-container-2048">
        {tiles.map(tile => {
          // استایل موقعیت‌یابی واکنش‌گرا برای هر کاشی
          const style = {
            transform: `translate(
              calc(${tile.col} * (var(--cell-size) + var(--cell-gap))), 
              calc(${tile.row} * (var(--cell-size) + var(--cell-gap)))
            )`
          };
          
          return (
            <div key={tile.id} className="tile-wrapper-2048" style={style}>
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