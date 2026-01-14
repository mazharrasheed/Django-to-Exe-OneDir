
import { GoogleGenAI } from "@google/genai";
import { Project, Transaction } from "../types";

export const getFinancialInsights = async (project: Project, transactions: Transaction[]) => {
  // Always use process.env.API_KEY directly when initializing GoogleGenAI
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prompt = `
    Analyze this project's finances:
    Project Name: ${project.name}
    Description: ${project.description}
    Total Income: $${incomeTotal}
    Total Expense: $${expenseTotal}
    Current Balance: $${incomeTotal - expenseTotal}
    Transaction Count: ${transactions.length}

    Provide a very brief 2-sentence financial health summary and one actionable tip to improve profitability.
    Respond in plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Insights are temporarily unavailable. Keep tracking your expenses!";
  }
};
