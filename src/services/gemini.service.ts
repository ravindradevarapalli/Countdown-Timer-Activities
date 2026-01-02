
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai = new GoogleGenAI({ apiKey: (process as any).env.API_KEY });

  async generateMotivation(timerTitle: string, category: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, powerful, and unique motivational quote (max 15 words) for someone waiting for an event titled "${timerTitle}" which is categorized as "${category}". Make it inspiring and relevant.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text.replace(/"/g, '').trim();
    } catch (error) {
      console.error('Gemini error:', error);
      return "The future belongs to those who believe in the beauty of their dreams.";
    }
  }

  async generateCongratulations(timerTitle: string, category: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a celebratory, rewarding, and short message (max 12 words) for someone who just finished a countdown for "${timerTitle}" (${category}). Make it feel like a victory!`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text.replace(/"/g, '').trim();
    } catch (error) {
      console.error('Gemini error:', error);
      return "Mission Accomplished! You did it.";
    }
  }
}
