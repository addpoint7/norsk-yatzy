import React, { useState, useEffect, useCallback } from 'react';
import { Dices, RotateCcw, Trophy, Users, Sparkles, Lock, Unlock, Crown } from 'lucide-react';
import Die from './components/Die';
import ScoreTable from './components/ScoreTable';
import { Player, DieState, Category, GameState } from './types';
import { calculateTotal } from './services/gameLogic';
import { getGeminiAdvice } from './services/geminiService';

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
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    dice: INITIAL_DICE,
    rollsLeft: 3,
    turnCount: 0,
    gameOver: false,
    winnerId: null,
  });

  // AI Advice State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
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
    setAiAdvice(null);
    setGameStarted(true);
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
    setAiAdvice(null); // Clear old advice

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
    setAiAdvice(null);
  };

  const fetchAiAdvice = async () => {
    if (gameState.rollsLeft === 3) return; // Haven't rolled yet
    setLoadingAdvice(true);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const advice = await getGeminiAdvice(gameState.dice, currentPlayer.scores, gameState.rollsLeft);
    setAiAdvice(advice);
    setLoadingAdvice(false);
  };

  // Component for Controls
  const Controls = () => (
    <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-xl border border-slate-200 mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            {gameState.players[gameState.currentPlayerIndex]?.name} sin tur
        </span>
        <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm border border-indigo-100">
            Kast igjen: {gameState.rollsLeft}
        </span>
      </div>

      {/* Dice Row */}
      <div className="flex justify-center gap-3 sm:gap-6 mb-4">
        {gameState.dice.map((die) => (
          <div key={die.id} className="flex flex-col items-center gap-2">
             <Die 
               value={die.value} 
               isLocked={die.isLocked} 
               onClick={() => toggleLock(die.id)} 
               rolling={isRolling && !die.isLocked}
             />
             <div className="text-[10px] font-bold uppercase tracking-wide text-green-600 transition-opacity" style={{ opacity: die.isLocked ? 1 : 0}}>
               Låst
             </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={rollDice}
          disabled={gameState.rollsLeft === 0 || isRolling}
          className={`
            py-4 px-6 rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-3 transition-all
            ${gameState.rollsLeft > 0 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-1' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
          `}
        >
          <RotateCcw className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
          {gameState.rollsLeft === 3 ? 'Kast terninger' : gameState.rollsLeft > 0 ? 'Kast igjen' : 'Velg poengsum'}
        </button>

        <button
            onClick={fetchAiAdvice}
            disabled={gameState.rollsLeft === 3 || gameState.rollsLeft === 0 || loadingAdvice}
            className={`
                py-4 px-6 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all border
                ${gameState.rollsLeft < 3 && gameState.rollsLeft > 0
                    ? 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'}
            `}
        >
            {loadingAdvice ? (
                <span className="animate-pulse">Tenker...</span>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Spør AI om tips
                </>
            )}
        </button>
      </div>
      
      <div className="text-center text-slate-400 text-sm mt-2">
         {gameState.rollsLeft < 3 ? 'Klikk på terninger for å låse/låse opp' : 'Kast for å starte runden'}
      </div>

      {/* AI Advice Box */}
      {aiAdvice && (
          <div className="mt-2 p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-fadeIn shadow-sm">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm mt-1 text-indigo-600">
                      <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                      <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">AI Rådgiver</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{aiAdvice}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  // Render Winner Overlay
  if (gameState.gameOver) {
    const winner = gameState.players.find(p => p.id === gameState.winnerId);
    return (
        <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 fixed inset-0 z-50">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 text-center animate-fadeIn">
                <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-6">
                  <Crown className="w-16 h-16 text-yellow-500 animate-bounce" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Spillet er slutt!</h1>
                <p className="text-slate-500 mb-8">Gratulerer til vinneren</p>
                
                <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
                    <div className="text-2xl font-bold text-indigo-600">{winner?.name}</div>
                    <div className="text-4xl font-bold text-slate-900 mt-2">{calculateTotal(winner!.scores)} poeng</div>
                </div>

                <button 
                    onClick={() => setGameStarted(false)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-lg transition-colors shadow-lg shadow-indigo-200"
                >
                    Spill igjen
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-md">
                    <Dices className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Norsk Yatzy</h1>
            </div>
            {!gameStarted && (
                <div className="text-slate-500 text-sm hidden sm:block font-medium">Klassiske norske regler</div>
            )}
            {gameStarted && (
                <button onClick={() => setGameStarted(false)} className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors">
                    Avslutt spill
                </button>
            )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {!gameStarted ? (
          // Setup Screen
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fadeIn">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-slate-900">
                    Velkommen til Yatzy
                </h2>
                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                    Spill den norske klassikeren.<br />
                    Skriv inn navn og start spillet!
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm">
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
        ) : (
          // Game Board
          <div className="space-y-6 animate-fadeIn">
            <Controls />
            
            <div className="space-y-4">
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider pl-2">Poengtavle</h3>
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
          </div>
        )}
      </main>
    </div>
  );
};

export default App;