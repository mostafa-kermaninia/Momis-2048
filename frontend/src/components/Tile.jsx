import React from 'react';

const Tile = ({ value, isNew, isMerged }) => {
  const tileClasses = [
    'tile',
    `tile-${value}`,
    isNew ? 'tile-new' : '',
    isMerged ? 'tile-merged' : '',
    value > 1000 ? 'text-small' : value > 100 ? 'text-medium' : 'text-large'
  ].join(' ');

  return (
    <div className={tileClasses}>
      {value > 0 ? value : ''}
    </div>
  );
};

export default Tile;