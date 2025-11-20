import React from 'react';
import { Category, Player, ScoreSheet } from '../types';
import { calculateScore, calculateUpperSum, calculateTotal } from '../services/gameLogic';
import { Check } from 'lucide-react';

interface ScoreTableProps {
  players: Player[];
  currentPlayerId: number;
  currentDice: any[];
  onSelectCategory: (cat: Category, score: number) => void;
  gameStarted: boolean;
  rollsLeft: number;
  turnCount: number;
}

const ScoreTable: React.FC<ScoreTableProps> = ({ 
  players, 
  currentPlayerId, 
  currentDice, 
  onSelectCategory,
  gameStarted,
  rollsLeft
}) => {

  const renderRow = (category: Category, isHeader = false, isSum = false) => {
    return (
      <tr key={category} className={`${isSum ? 'bg-slate-100 font-bold text-slate-900' : 'border-b border-slate-100 hover:bg-slate-50'}`}>
        {/* Sticky Left Column (Categories) */}
        <td className={`
            p-2 sm:p-3 text-sm sm:text-base font-medium whitespace-nowrap 
            sticky left-0 z-30 
            border-r border-slate-100 drop-shadow-[2px_0_0_rgba(0,0,0,0.02)]
            ${isSum ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-600'}
        `}>
            {category}
        </td>
        
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const hasScore = player.scores[category] !== undefined && player.scores[category] !== null;
          const score = player.scores[category];
          
          // Calculate potential score if it's current player's turn and category is open
          let potentialScore: number | null = null;
          if (gameStarted && isCurrentPlayer && !hasScore && !isSum && rollsLeft < 3) {
             potentialScore = calculateScore(category, currentDice);
          }

          // Special calculation for sums
          let displayValue: number | string = score !== undefined && score !== null ? score : '';
          
          if (category === Category.SUM) {
              displayValue = calculateUpperSum(player.scores);
          } else if (category === Category.BONUS) {
              const upper = calculateUpperSum(player.scores);
              displayValue = upper >= 63 ? 50 : 0;
          } else if (category === Category.TOTAL) {
              displayValue = calculateTotal(player.scores);
          }

          return (
            <td 
              key={`${player.id}-${category}`} 
              className={`
                p-2 sm:p-3 text-center border-l border-r border-slate-100 transition-all relative
                ${isCurrentPlayer ? 'border-indigo-100 border-x-2' : ''}
                ${hasScore && !isSum ? 'bg-slate-50 inner-shadow' : ''} 
                ${potentialScore !== null ? 'cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold' : 'text-slate-800'}
                ${isCurrentPlayer && !hasScore && !isSum && potentialScore === null ? 'bg-indigo-50/30' : ''}
              `}
              onClick={() => {
                if (potentialScore !== null) {
                  onSelectCategory(category, potentialScore);
                }
              }}
            >
               <div className="flex items-center justify-center gap-1 min-h-[1.5rem]">
                 {hasScore && !isSum && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Check className="w-8 h-8 text-green-500/10" />
                    </div>
                 )}
                 
                 <span className="relative z-10">
                    {hasScore || isSum ? displayValue : (potentialScore !== null ? potentialScore : '')}
                 </span>

                 {hasScore && !isSum && (
                     <Check className="w-3 h-3 text-green-600 absolute top-1 right-1 opacity-70" />
                 )}
               </div>
            </td>
          );
        })}
      </tr>
    );
  };

  // Split categories into Upper and Lower section for better rendering
  const upperSection = [
    Category.ONES, Category.TWOS, Category.THREES, Category.FOURS, Category.FIVES, Category.SIXES
  ];
  
  const lowerSection = [
    Category.ONE_PAIR, Category.TWO_PAIRS, Category.THREE_OF_A_KIND, Category.FOUR_OF_A_KIND,
    Category.SMALL_STRAIGHT, Category.LARGE_STRAIGHT, Category.FULL_HOUSE, Category.CHANCE, Category.YATZY
  ];

  return (
    // Wrapper needs height and overflow for sticky to work correctly
    <div className="h-full w-full overflow-auto bg-white shadow-inner">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-40 bg-slate-50 shadow-sm">
          <tr className="border-b border-slate-200 bg-slate-50">
            {/* Sticky Top-Left Corner */}
            <th className="p-3 text-left text-slate-500 font-semibold text-sm uppercase tracking-wider bg-slate-50 sticky left-0 top-0 z-50 border-r border-slate-200 min-w-[100px]">
                Kategori
            </th>
            {players.map(p => (
              <th key={p.id} className={`
                p-2 sm:p-3 border-l border-r border-slate-200 relative transition-colors 
                min-w-[65px] sm:min-w-[100px] max-w-[80px] sm:max-w-[120px]
                ${p.id === currentPlayerId ? 'bg-indigo-50 border-indigo-200 border-x-2' : 'bg-slate-50'}
              `}>
                {p.id === currentPlayerId && (
                    <div className="absolute -top-0 inset-x-0 h-1 bg-indigo-500"></div>
                )}
                <div className="flex flex-col items-center w-full overflow-hidden">
                   <span className="text-sm sm:text-lg font-bold truncate w-full text-center text-slate-800 block" title={p.name}>
                       {p.name}
                   </span>
                   {p.id === currentPlayerId && gameStarted && (
                       <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold animate-pulse bg-indigo-100 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
                           Din tur
                       </span>
                   )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {upperSection.map(c => renderRow(c))}
          {renderRow(Category.SUM, false, true)}
          {renderRow(Category.BONUS, false, true)}
          
          <tr><td colSpan={players.length + 1} className="h-4 bg-slate-50/50 border-y border-slate-200 sticky left-0 z-0"></td></tr>
          
          {lowerSection.map(c => renderRow(c))}
          
          <tr><td colSpan={players.length + 1} className="h-1 bg-indigo-500 sticky left-0"></td></tr>
          {renderRow(Category.TOTAL, false, true)}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreTable;