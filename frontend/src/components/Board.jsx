import React from 'react';
import Tile from './Tile';

/**
 * کامپوننت نمایش کل صفحه بازی.
 * این نسخه برای پشتیبانی کامل از انیمیشن‌ها بازنویسی شده است.
 * @param {object} props
 * @param {number[][]} props.board - آرایه دو بعدی که وضعیت فعلی بازی را نشان می‌دهد.
 */
const Board = ({ board, tiles }) => {
  return (
    <div className="board-container">
      {/* ۱. گرید ثابت پس‌زمینه */}
      <div className="grid-container">
        {Array(16).fill(null).map((_, i) => <div key={i} className="grid-cell"></div>)}
      </div>

      {/* ۲. کانتینر کاشی‌های متحرک 
        کاشی‌ها دیگر در گرید نیستند، بلکه به صورت مطلق روی آن شناورند
        و با استایل‌های inline موقعیت‌دهی می‌شوند.
      */}
      <div className="tile-container">
        {tiles.map(tile => (
          <div 
            key={tile.id} 
            className="tile-wrapper"
            style={{
              transform: `translate(calc(${tile.col} * (100% + 15px)), calc(${tile.row} * (100% + 15px)))`
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