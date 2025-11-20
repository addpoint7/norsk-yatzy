import { Category, DieState, ScoreSheet } from '../types';

// Hjelpefunksjon for å telle forekomster av hver terningverdi
const getCounts = (dice: DieState[]): Record<number, number> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach((die) => {
    counts[die.value]++;
  });
  return counts;
};

const sumDice = (dice: DieState[]) => dice.reduce((acc, die) => acc + die.value, 0);

export const calculateScore = (category: Category, dice: DieState[]): number => {
  const counts = getCounts(dice);
  const values = dice.map((d) => d.value);

  switch (category) {
    case Category.ONES:
      return counts[1] * 1;
    case Category.TWOS:
      return counts[2] * 2;
    case Category.THREES:
      return counts[3] * 3;
    case Category.FOURS:
      return counts[4] * 4;
    case Category.FIVES:
      return counts[5] * 5;
    case Category.SIXES:
      return counts[6] * 6;

    case Category.ONE_PAIR:
      // Norsk regel: Høyeste par teller
      for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 2) return i * 2;
      }
      return 0;

    case Category.TWO_PAIRS:
      // Må være to FORSKJELLIGE par
      let pairs: number[] = [];
      for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 2) pairs.push(i);
      }
      if (pairs.length >= 2) {
        return pairs[0] * 2 + pairs[1] * 2;
      }
      return 0;

    case Category.THREE_OF_A_KIND:
      for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 3) return i * 3;
      }
      return 0;

    case Category.FOUR_OF_A_KIND:
      for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 4) return i * 4;
      }
      return 0;

    case Category.SMALL_STRAIGHT:
      // Norsk regel: 1-2-3-4-5. Gir 15 poeng.
      if (counts[1] >= 1 && counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1) {
        return 15;
      }
      return 0;

    case Category.LARGE_STRAIGHT:
      // Norsk regel: 2-3-4-5-6. Gir 20 poeng.
      if (counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1 && counts[6] >= 1) {
        return 20;
      }
      return 0;

    case Category.FULL_HOUSE:
      // 3 like + 2 like. (F.eks 3x5 + 2x2)
      let threeVal = 0;
      let twoVal = 0;
      for (let i = 6; i >= 1; i--) {
        if (counts[i] >= 3) {
          threeVal = i;
          break;
        }
      }
      if (threeVal > 0) {
        for (let i = 6; i >= 1; i--) {
          if (counts[i] >= 2 && i !== threeVal) {
            twoVal = i;
            break;
          }
        }
      }
      if (threeVal > 0 && twoVal > 0) {
        return (threeVal * 3) + (twoVal * 2);
      }
      return 0;

    case Category.CHANCE:
      return sumDice(dice);

    case Category.YATZY:
      for (let i = 1; i <= 6; i++) {
        if (counts[i] === 5) return 50;
      }
      return 0;

    default:
      return 0;
  }
};

export const calculateUpperSum = (scores: ScoreSheet): number => {
  let sum = 0;
  sum += (scores[Category.ONES] || 0);
  sum += (scores[Category.TWOS] || 0);
  sum += (scores[Category.THREES] || 0);
  sum += (scores[Category.FOURS] || 0);
  sum += (scores[Category.FIVES] || 0);
  sum += (scores[Category.SIXES] || 0);
  return sum;
};

export const calculateTotal = (scores: ScoreSheet): number => {
  let total = 0;
  // Sum upper section
  const upperSum = calculateUpperSum(scores);
  total += upperSum;
  
  // Bonus
  if (upperSum >= 63) total += 50;

  // Lower section
  total += (scores[Category.ONE_PAIR] || 0);
  total += (scores[Category.TWO_PAIRS] || 0);
  total += (scores[Category.THREE_OF_A_KIND] || 0);
  total += (scores[Category.FOUR_OF_A_KIND] || 0);
  total += (scores[Category.SMALL_STRAIGHT] || 0);
  total += (scores[Category.LARGE_STRAIGHT] || 0);
  total += (scores[Category.FULL_HOUSE] || 0);
  total += (scores[Category.CHANCE] || 0);
  total += (scores[Category.YATZY] || 0);

  return total;
};

export const isUpperCategory = (cat: Category): boolean => {
  return [
    Category.ONES, Category.TWOS, Category.THREES, 
    Category.FOURS, Category.FIVES, Category.SIXES
  ].includes(cat);
};