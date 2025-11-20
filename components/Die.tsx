import React from 'react';

interface DieProps {
  value: number;
  isLocked: boolean;
  onClick: () => void;
  rolling: boolean;
}

const Dot: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <circle cx={cx} cy={cy} r="10" fill="currentColor" />
);

const Die: React.FC<DieProps> = ({ value, isLocked, onClick, rolling }) => {
  const dots = [];

  // Dot positions
  const c = 50;
  const tl = 25;
  const tr = 75;
  const bl = 25;
  const br = 75;

  if ([1, 3, 5].includes(value)) dots.push(<Dot key="c" cx={c} cy={c} />);
  if ([2, 3, 4, 5, 6].includes(value)) {
    dots.push(<Dot key="tl" cx={tl} cy={tl} />); // top-left (re-used positions for simplicity in layout logic)
    dots.push(<Dot key="br" cx={br} cy={br} />); // bottom-right
  }
  if ([4, 5, 6].includes(value)) {
    dots.push(<Dot key="tr" cx={tr} cy={tl} />); // top-right
    dots.push(<Dot key="bl" cx={bl} cy={br} />); // bottom-left
  }
  if (value === 6) {
    dots.push(<Dot key="ml" cx={tl} cy={c} />); // mid-left
    dots.push(<Dot key="mr" cx={tr} cy={c} />); // mid-right
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200
        border-2
        ${isLocked 
            ? 'border-green-500 ring-2 ring-green-200 -translate-y-2 shadow-lg shadow-green-200' 
            : 'border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-md'
        }
        ${rolling ? 'animate-spin' : ''}
      `}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 p-1">
        {dots}
      </svg>
    </div>
  );
};

export default Die;