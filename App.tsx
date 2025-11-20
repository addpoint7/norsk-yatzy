import React, { useState, useEffect } from 'react';
import { Dices, RotateCcw, Crown, Trophy, Eye } from 'lucide-react';
import Die from './components/Die';
import ScoreTable from './components/ScoreTable';
import { Player, DieState, Category, GameState } from './types';
import { calculateTotal } from './services/gameLogic';

// Initial configuration
const INITIAL_DICE: DieState[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  value: 1,
  isLocked: false,
}));

const App: React.FC = () => {
  // Setup State
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['Spiller 1', 'Spiller 2']);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    dice: INITIAL_DICE,
    rollsLeft: 3,
    turnCount: 0,
    gameOver: false,
    winnerId: null,
  });

  const [isRolling, setIsRolling] = useState(false);

  // Update player names array when number of players changes
  useEffect(() => {
    setPlayerNames(prev => {
      const newNames = [...prev];
      if (numPlayers > prev.length) {
        for (let i = prev.length; i < numPlayers; i++) {
          newNames.push(`Spiller ${i + 1}`);
        }
      } else {
        return newNames.slice(0, numPlayers);
      }
      return newNames;
    });
  }, [numPlayers]);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const initializeGame = () => {
    const newPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: i,
      name: playerNames[i] || `Spiller ${i + 1}`,
      scores: {},
      isBot: false,
    }));

    setGameState({
      players: newPlayers,
      currentPlayerIndex: 0,
      dice: INITIAL_DICE,
      rollsLeft: 3,
      turnCount: 0,
      gameOver: false,
      winnerId: null,
    });
    setGameStarted(true);
    setShowWinnerModal(false);
  };

  const toggleLock = (id: number) => {
    if (gameState.rollsLeft === 3 || gameState.rollsLeft === 0 || gameState.gameOver) return;
    
    setGameState(prev => ({
      ...prev,
      dice: prev.dice.map(d => d.id === id ? { ...d, isLocked: !d.isLocked } : d)
    }));
  };

  const rollDice = () => {
    if (gameState.rollsLeft <= 0 || gameState.gameOver) return;

    setIsRolling(true);

    // Animation delay
    setTimeout(() => {
      const newDice = gameState.dice.map(d => ({
        ...d,
        value: d.isLocked ? d.value : Math.ceil(Math.random() * 6)
      }));

      setGameState(prev => ({
        ...prev,
        dice: newDice,
        rollsLeft: prev.rollsLeft - 1
      }));
      setIsRolling(false);
    }, 600);
  };

  const handleSelectCategory = (category: Category, score: number) => {
    if (gameState.gameOver) return;

    setGameState(prev => {
      const updatedPlayers = [...prev.players];
      const currentPlayer = updatedPlayers[prev.currentPlayerIndex];

      // Assign score
      currentPlayer.scores[category] = score;

      // Check for Game Over
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const nextTurnCount = prev.turnCount + (nextPlayerIndex === 0 ? 1 : 0); 
      
      const isGameOver = updatedPlayers.every(p => {
         const filled = Object.keys(p.scores).length;
         return filled >= 15;
      });

      let winnerId = null;
      if (isGameOver) {
        const sorted = [...updatedPlayers].sort((a, b) => calculateTotal(b.scores) - calculateTotal(a.scores));
        winnerId = sorted[0].id;
        setShowWinnerModal(true);
      }

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCount: nextTurnCount,
        rollsLeft: 3,
        dice: INITIAL_DICE.map(d => ({ ...d, isLocked: false, value: 1 })), // Reset dice visual
        gameOver: isGameOver,
        winnerId
      };
    });
  };

  // Component for Controls
  const Controls = () => (
    <div className="flex flex-col gap-3 bg-white p-4 sm:p-6 border-b border-slate-200 shadow-sm z-30">
      <div className="flex justify-between items-center mb-1">
        <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            {gameState.players[gameState.currentPlayerIndex]?.name} sin tur
            {gameState.gameOver && <span className="text-red-500 font-bold">(Ferdig)</span>}
        </span>
        <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm border border-indigo-100">
            Kast igjen: {gameState.rollsLeft}
        </span>
      </div>

      {/* Dice Row */}
      <div className="flex justify-center gap-2 sm:gap-6 mb-2">
        {gameState.dice.map((die) => (
          <div key={die.id} className="flex flex-col items-center gap-1 sm:gap-2">
             <Die 
               value={die.value} 
               isLocked={die.isLocked} 
               onClick={() => toggleLock(die.id)} 
               rolling={isRolling && !die.isLocked}
             />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full">
        <button
          onClick={rollDice}
          disabled={gameState.rollsLeft === 0 || isRolling || gameState.gameOver}
          className={`
            w-full py-3 sm:py-4 px-6 rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-3 transition-all
            ${gameState.rollsLeft > 0 && !gameState.gameOver
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-1' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
          `}
        >
          <RotateCcw className={`w-5 h-5 sm:w-6 sm:h-6 ${isRolling ? 'animate-spin' : ''}`} />
          {gameState.rollsLeft === 3 ? 'Kast terninger' : gameState.rollsLeft > 0 ? 'Kast igjen' : 'Velg poengsum'}
        </button>
      </div>
      
      <div className="text-center text-slate-400 text-xs sm:text-sm">
         {gameState.rollsLeft < 3 ? 'Klikk på terninger for å låse/låse opp' : 'Kast for å starte runden'}
      </div>
    </div>
  );

  // Winner Overlay Modal
  const WinnerModal = () => {
      if (!gameState.gameOver || !showWinnerModal) return null;

      const winner = gameState.players.find(p => p.id === gameState.winnerId);
      
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 text-center max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
                
                <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-6 ring-4 ring-yellow-50">
                  <Trophy className="w-12 h-12 text-yellow-600 animate-bounce" />
                </div>
                
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Gratulerer!</h1>
                <p className="text-slate-500 mb-8">Vinneren av årets Yatzy er:</p>
                
                <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <span className="text-2xl font-bold text-indigo-600">{winner?.name}</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900">{calculateTotal(winner!.scores)} poeng</div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={initializeGame}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-200"
                    >
                        Start nytt spill
                    </button>
                    <button 
                        onClick={() => setShowWinnerModal(false)}
                        className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Eye className="w-5 h-5" />
                        Se resultattavle
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Header - Static */}
      <header className="bg-white border-b border-slate-200 p-3 sm:p-4 flex-none z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-md">
                    <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Norsk Yatzy</h1>
            </div>
            
            <div className="flex items-center gap-3">
                {gameState.gameOver && !showWinnerModal && (
                    <button 
                        onClick={() => setShowWinnerModal(true)}
                        className="text-sm px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1"
                    >
                        <Trophy className="w-4 h-4" /> Vis vinner
                    </button>
                )}
                {gameStarted && (
                    <button onClick={() => setGameStarted(false)} className="text-xs sm:text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
                        Avslutt
                    </button>
                )}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative max-w-4xl w-full mx-auto overflow-hidden">
        {!gameStarted ? (
          // Setup Screen - Scrollable
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
             <div className="flex flex-col items-center justify-center min-h-full space-y-8 animate-fadeIn pb-10">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                        Velkommen til Yatzy
                    </h2>
                    <p className="text-slate-500 max-w-md mx-auto text-base sm:text-lg leading-relaxed">
                        Spill den norske klassikeren.<br />
                        Skriv inn navn og start spillet!
                    </p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm">
                    <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-3">Antall spillere</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[2, 3, 4].map(num => (
                            <button
                                key={num}
                                onClick={() => setNumPlayers(num)}
                                className={`
                                    py-3 rounded-xl border-2 font-bold text-lg transition-all
                                    ${numPlayers === num 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50'}
                                `}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    </div>

                    <div className="mb-8 space-y-3">
                    <label className="block text-slate-700 text-sm font-bold">Navn på spillere</label>
                    {playerNames.slice(0, numPlayers).map((name, idx) => (
                        <div key={idx} className="relative">
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(idx, e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 placeholder-slate-400"
                            placeholder={`Spiller ${idx + 1}`}
                        />
                        <div className="absolute right-3 top-3.5 text-slate-400 text-xs font-medium pointer-events-none">
                            #{idx + 1}
                        </div>
                        </div>
                    ))}
                    </div>
                    
                    <button 
                        onClick={initializeGame}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
                    >
                        Start Spillet
                    </button>
                </div>
             </div>
          </div>
        ) : (
          // Game Board layout - Uses flex to fill space
          <>
            {/* Controls - Static below header */}
            <div className="flex-none z-30">
               <Controls />
            </div>
            
            {/* Table Container - Fills remaining height and handles scrolling internally */}
            <div className="flex-1 bg-slate-50 overflow-hidden relative">
                <ScoreTable 
                    players={gameState.players} 
                    currentPlayerId={gameState.currentPlayerIndex}
                    currentDice={gameState.dice}
                    onSelectCategory={handleSelectCategory}
                    gameStarted={gameStarted}
                    rollsLeft={gameState.rollsLeft}
                    turnCount={gameState.turnCount}
                />
            </div>
            
            {/* Winner Modal Overlay */}
            <WinnerModal />
          </>
        )}
      </main>
    </div>
  );
};

export default App;