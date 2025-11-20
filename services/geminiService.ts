import { GoogleGenAI } from "@google/genai";
import { Category, DieState, ScoreSheet } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiAdvice = async (
  dice: DieState[], 
  scoreSheet: ScoreSheet, 
  rollsLeft: number
): Promise<string> => {
  
  const diceValues = dice.map(d => d.value).join(', ');
  const openCategories = Object.values(Category).filter(cat => 
    cat !== Category.SUM && 
    cat !== Category.BONUS && 
    cat !== Category.TOTAL && 
    scoreSheet[cat] === undefined
  ).join(', ');

  const prompt = `
    Du er en ekspert på brettspillet Norsk Yatzy.
    
    Nåværende terninger: [${diceValues}]
    Antall kast igjen denne turen: ${rollsLeft}
    Åpne kategorier spilleren kan velge: ${openCategories}

    Gi et kort, strategisk råd (maks 2 setninger) om hvilke terninger som bør beholdes og hva spilleren bør satse på. 
    Vær entusiastisk og snakk direkte til spilleren. Svar på norsk.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Klarte ikke å hente råd fra AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI-tjenesten er midlertidig utilgjengelig.";
  }
};
