import React from 'react';
import { Category, Player, ScoreSheet } from '../types';
import { calculateScore, calculateUpperSum, calculateTotal } from '../services/gameLogic';
import { Crown } from 'lucide-react';

interface ScoreTableProps {
  players: Player[];
  currentPlayerId: number;
  currentDice: any[];
  onSelectCategory: (cat: Category, score: number) => void;
  gameStarted: boolean;
  rollsLeft: number;
  turnCount: number;
}

const categories = Object.values(Category);

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
        <td className="p-2 sm:p-3 text-sm sm:text-base text-slate-600 font-medium whitespace-nowrap">
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
                p-2 sm:p-3 text-center border-l border-slate-100 transition-colors
                ${isCurrentPlayer && !isSum ? 'bg-indigo-50' : ''}
                ${potentialScore !== null ? 'cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold' : 'text-slate-800'}
              `}
              onClick={() => {
                if (potentialScore !== null) {
                  onSelectCategory(category, potentialScore);
                }
              }}
            >
               {hasScore || isSum ? displayValue : (potentialScore !== null ? potentialScore : '')}
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

  // Sort players by score if game is over, otherwise by ID
  const sortedPlayers = [...players]; 

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-3 text-left text-slate-500 font-semibold text-sm uppercase tracking-wider">Kategori</th>
            {sortedPlayers.map(p => (
              <th key={p.id} className={`p-3 border-l border-slate-200 min-w-[100px] ${p.id === currentPlayerId ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}>
                <div className="flex flex-col items-center">
                   <span className="text-lg font-bold">{p.name}</span>
                   {p.id === currentPlayerId && gameStarted && <span className="text-xs text-indigo-500 font-medium animate-pulse">Kaster nå</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {upperSection.map(c => renderRow(c))}
          {renderRow(Category.SUM, false, true)}
          {renderRow(Category.BONUS, false, true)}
          
          <tr><td colSpan={players.length + 1} className="h-4 bg-slate-50 border-y border-slate-200"></td></tr>
          
          {lowerSection.map(c => renderRow(c))}
          
          <tr><td colSpan={players.length + 1} className="h-1 bg-indigo-500"></td></tr>
          {renderRow(Category.TOTAL, false, true)}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreTable;