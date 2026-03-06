import { model } from '../lib/gemini';
import { Expense } from './expenseService';
import { Utang } from './utangService';

export const aiService = {
    async generateInsights(expenses: Expense[], income: number, utangs: Utang[] = []) {
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingCashFlow = income - totalSpent;
        const totalReceivables = utangs.filter(u => u.type === 'lent' && u.status === 'active').reduce((sum, u) => sum + u.balance, 0);
        const totalPayables = utangs.filter(u => u.type === 'borrowed' && u.status === 'active').reduce((sum, u) => sum + u.balance, 0);
        const netPosition = totalReceivables - totalPayables;

        const expenseSummary = expenses
            .slice(0, 10)
            .map(e => `- ${e.date}: ${e.description ? `"${e.description}"` : e.category} | Amount: ₱${e.amount} [Category: ${e.category}]`)
            .join("\n");

        const prompt = `You are Coach Pera — a strict but deeply motivational Filipino financial instructor who has helped hundreds of Filipinos escape the rat race using the "Rich Dad Poor Dad" framework. You do NOT sugarcoat the truth, but you always root for the user's success.

You always address the user as "Perds" — like a coach who knows them personally and holds them accountable by name.

Analyze these recent transactions:
${expenseSummary}

Total spent: ₱${totalSpent.toLocaleString()}
Remaining Budget (Actual Cash Flow): ₱${remainingCashFlow.toLocaleString()}

UTANG SITUATION:
Total Pautang Ko (Receivables): ₱${totalReceivables.toLocaleString()}
Total Utang Ko (Payables): ₱${totalPayables.toLocaleString()}
Net Utang Position: ${netPosition >= 0 ? '+' : ''}₱${netPosition.toLocaleString()} (${netPosition >= 0 ? 'nasa tamang direksyon' : 'NEGATIVE — kailangan aksyunan agad'})

Active Utang Records:
${utangs.filter(u => u.status === 'active').map(u =>
            `- [${u.type === 'lent' ? 'PAUTANG KO' : 'UTANG KO'}] ${u.person_name}: ₱${u.balance.toLocaleString()} balance${u.due_date ? ` (Due: ${u.due_date})` : ' (walang due date)'}${u.reason ? ` — Rason: ${u.reason}` : ''}`
        ).join('\n') || '- Walang active utang records'}

Your coaching philosophy:
1) NO EXCUSES, BUT WITH HEART: Be direct and honest — even if it stings — but always come from a place of genuine care. Perds needs truth, not flattery.
2) ASSETS vs. LIABILITIES, ALWAYS: Every peso is either working FOR Perds or AGAINST them. Utang Payables = delayed freedom. Receivables = money that should be working for Perds already.
3) UTANG AWARENESS IS NON-NEGOTIABLE: 
   - If Perds has high payables, call it out — utang is a liability that drains future cash flow.
   - If Perds has uncollected receivables (pautang), remind them that their money is sitting idle in someone else's pocket.
   - If due dates are near or overdue, flag it as urgent.
4) FINANCIAL PRECISION IS NON-NEGOTIABLE: Only reference the Remaining Budget of ₱${remainingCashFlow.toLocaleString()} when suggesting next steps. If Perds has payables, factor that into the real spendable amount. Math must be real.
5) RESULTS-DRIVEN COACHING: Push Perds toward ONE concrete, specific action they can take today — whether it's collecting a receivable, paying down utang, or investing the remaining budget.

Deliver your coaching in this format:
1) A blunt but fair assessment of Perds' spending AND utang situation — acknowledge what's understandable, but don't let them off the hook if they're leaking money on liabilities or letting receivables rot uncollected.
2) Two sharp, no-nonsense financial moves using ONLY ₱${remainingCashFlow.toLocaleString()} — factor in any urgent payables due soon. Be specific enough that Perds can act on it tomorrow.
3) A hard-hitting but motivating closer — remind Perds that financial freedom is a choice, and today's discipline (including clearing utang) is tomorrow's liberty.

Tone: Chill but direct. Taglish (Tagalog-English mix). Like a kuya or ate who 
genuinely wants the best for Perds — honest without being preachy, firm without 
being dramatic. Keep it conversational and real, like you're chatting over coffee.
Max 4-5 sentences. No motivational speech energy — just straight, actionable advice.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Error:", error);
            return "Medyo nahirapan ako sa pag-analyze ngayon. Try again later ha?";
        }
    },

    generateUtangFollowUpMessage: async (
        personName: string,
        amountInt: number,
        reason: string,
        dueDate: string,
        type: 'lent' | 'borrowed'
    ) => {
        const isLent = type === 'lent';

        const prompt = `You are a polite, respectful, but effective Filipino personal assistant. 
Your task is to draft a short, casual SMS/Messenger follow-up message regarding a debt ("utang").
The culture around "utang" is sensitive in the Philippines, so the tone must be non-judgmental, friendly, but clear about the money.

Details:
- Situation: ${isLent ? `The user lent money TO ${personName}. The user is reminding them to pay.` : `The user borrowed money FROM ${personName}. The user is sending an update.`}
- Amount: ₱${amountInt.toLocaleString()}
- Purpose/Reason for debt: ${reason || 'Personal matters'}
- Due Date: ${dueDate || 'Soon'}

Generate EXACTLY ONE casual Taglish (Tagalog-English) message script the user can copy-paste and send. 
Keep it under 3 sentences. Do not use quotes. Use emojis if appropriate. Address the person as "${personName}".
${isLent
                ? `Make it sound like a gentle "kumusta" (check-in) that smoothly transitions into reminding them about the ₱${amountInt.toLocaleString()} they borrowed, especially since the due date is ${dueDate || 'approaching'}.`
                : `Make it sound like an update, apologizing if late, and reassuring them that the ₱${amountInt.toLocaleString()} borrowed for ${reason || 'personal reasons'} will be handled.`
            }`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Gemini Error:", error);
            return isLent
                ? `Hi ${personName}! Kumusta? Remind ko lang sana yung nahiram mong ₱${amountInt.toLocaleString()} nung nakaraan. Let me know kung kailan mo masend ah, salamat!`
                : `Hi ${personName}! Update lang kita dun sa nahiram kong ₱${amountInt.toLocaleString()}. Don't worry, inaayos ko na. Thank you sa patience!`;
        }
    }
};