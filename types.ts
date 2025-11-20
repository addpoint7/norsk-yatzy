export enum Category {
  ONES = 'Enere',
  TWOS = 'Toere',
  THREES = 'Treere',
  FOURS = 'Firere',
  FIVES = 'Femmere',
  SIXES = 'Seksere',
  SUM = 'Sum',
  BONUS = 'Bonus',
  ONE_PAIR = 'Ett par',
  TWO_PAIRS = 'To par',
  THREE_OF_A_KIND = 'Tre like',
  FOUR_OF_A_KIND = 'Fire like',
  SMALL_STRAIGHT = 'Liten Straight',
  LARGE_STRAIGHT = 'Stor Straight',
  FULL_HOUSE = 'Hus',
  CHANCE = 'Sjanse',
  YATZY = 'Yatzy',
  TOTAL = 'Totalt',
}

export type ScoreSheet = {
  [key in Category]?: number | null;
};

export interface Player {
  id: number;
  name: string;
  scores: ScoreSheet;
  isBot: boolean;
}

export interface DieState {
  id: number;
  value: number;
  isLocked: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  dice: DieState[];
  rollsLeft: number;
  turnCount: number; // Totalt 15 runder per spiller
  gameOver: boolean;
  winnerId: number | null;
}
