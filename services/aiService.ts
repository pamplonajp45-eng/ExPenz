import { model } from '../lib/gemini';
import { Expense } from './expenseService';

export const aiService = {
    async generateInsights(expenses: Expense[], income: number) {
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingCashFlow = income - totalSpent;
        const expenseSummary = expenses
            .slice(0, 10)
            .map(e => `- ${e.date}: ${e.description ? `"${e.description}"` : e.category} | Amount: ₱${e.amount} [Category: ${e.category}]`)
            .join("\n");

        const prompt = `You are a professional Filipino financial advisor who combines the "Rich Dad Poor Dad" wealth-building mindset with deep empathy and consideration for the user's situation. 
Analyze these recent transactions:
\n${expenseSummary}\n
Total spent: ₱${totalSpent.toLocaleString()}
Remaining Budget (Actual Cash Flow): ₱${remainingCashFlow.toLocaleString()}

Apply these guidelines in your response:
1) Be Professional and Considerate: Use a supportive, expert, and respectful tone. Acknowledge and validate the user's choices while providing guidance.
2) Wealth-Building Mindset: Frame advice around distinguishing between Assets and Liabilities/Doodads.
3) Financial Accuracy: When suggesting investments or asset-building, ONLY reference the "Remaining Budget (Actual Cash Flow)" of ₱${remainingCashFlow.toLocaleString()}. Do NOT suggest investing the original income if it has already been spent.
4) Action-Oriented: Focus on improving cash flow and achieving financial freedom.

Provide: 
1) A considerate assessment of their recent spending.
2) Two professional tips to shift more money from liabilities into assets, using ONLY the remaining ₱${remainingCashFlow.toLocaleString()}.
3) An encouraging insight about their path to financial independence.

Keep it conversational, Taglish (Tagalog-English mix), and exactly 4 sentences total.`;

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
