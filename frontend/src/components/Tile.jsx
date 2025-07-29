import React from 'react';

/**
 * کامپوننت نمایش یک کاشی در بازی.
 * @param {object} props
 * @param {number} props.value - مقدار عددی کاشی (e.g., 2, 4, 8)
 * @param {boolean} props.isNew - آیا این کاشی به تازگی ایجاد شده؟ (برای انیمیشن)
 * @param {boolean} props.isMerged - آیا این کاشی حاصل ادغام دو کاشی دیگر است؟ (برای انیمیشن)
 */
const Tile = ({ value, isNew, isMerged }) => {
  // تمام استایل‌ها توسط کلاس‌های CSS کنترل می‌شوند
  const classNames = [
    'tile',
    `tile-${value}`, // کلاسی برای رنگ بر اساس مقدار
    value > 1024 ? 'tile-supernova' : '', // برای اعداد بسیار بزرگ
    isNew ? 'tile-new' : '', // برای انیمیشن ظاهر شدن
    isMerged ? 'tile-merged' : '' // برای انیمیشن ادغام
  ].join(' ');

  // کلاس‌های متفاوت برای اندازه فونت
  const textClass = value > 1000 ? 'text-small' : value > 100 ? 'text-medium' : 'text-large';

  return (
    <div className={classNames}>
      <span className={textClass}>
        {value !== 0 ? value : ''}
      </span>
    </div>
  );
};

export default Tile;