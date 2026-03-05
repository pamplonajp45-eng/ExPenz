import { model } from '../lib/gemini';
import { Expense } from './expenseService';

export const aiService = {
    async generateInsights(expenses: Expense[], budget: number) {
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const expenseSummary = expenses
            .slice(0, 10)
            .map(e => `${e.description || e.category}: ₱${e.amount} (${e.category})`)
            .join("\n");

        const prompt = `You are a Filipino small business financial advisor. Analyze these recent expenses:
\n${expenseSummary}\n
Total spent: ₱${totalSpent.toLocaleString()}
Available budget: ₱${budget.toLocaleString()}

Provide: 
1) Overall assessment (good/warning/bad habit)
2) Top 2 saving tips specific to their purchases
3) One motivating insight. 
Keep it conversational and in Taglish (mix of Tagalog and English). Max 4 sentences total.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Error:", error);
            return "Medyo nahirapan ako sa pag-analyze ngayon. Try again later ha?";
        }
    }
};
