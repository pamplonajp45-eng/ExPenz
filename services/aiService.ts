import {
  getCurrentKeyIndex,
  getTotalKeys,
  model,
  rotateAPIKey,
} from "../lib/gemini";
import { Expense } from "./expenseService";
import { Utang } from "./utangService";

export const aiService = {
  async generateInsights(
    expenses: Expense[],
    income: number,
    utangs: Utang[] = [],
  ) {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingCashFlow = income - totalSpent;
    const totalReceivables = utangs
      .filter((u) => u.type === "lent" && u.status === "active")
      .reduce((sum, u) => sum + u.balance, 0);
    const totalPayables = utangs
      .filter((u) => u.type === "borrowed" && u.status === "active")
      .reduce((sum, u) => sum + u.balance, 0);
    const netPosition = totalReceivables - totalPayables;

    const expenseSummary = expenses
      .slice(0, 10)
      .map(
        (e) =>
          `- ${e.date}: ${e.description ? `"${e.description}"` : e.category} | Amount: ₱${e.amount} [Category: ${e.category}]`,
      )
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
Net Utang Position: ${netPosition >= 0 ? "+" : ""}₱${netPosition.toLocaleString()} (${netPosition >= 0 ? "nasa tamang direksyon" : "NEGATIVE — kailangan aksyunan agad"})

Active Utang Records:
${
  utangs
    .filter((u) => u.status === "active")
    .map(
      (u) =>
        `- [${u.type === "lent" ? "PAUTANG KO" : "UTANG KO"}] ${u.person_name}: ₱${u.balance.toLocaleString()} balance${u.due_date ? ` (Due: ${u.due_date})` : " (walang due date)"}${u.reason ? ` — Rason: ${u.reason}` : ""}`,
    )
    .join("\n") || "- Walang active utang records"
}

Your coaching philosophy:
1) HEALTH IS WEALTH, NON-NEGOTIABLE: You can't build wealth if you're breaking your body. Food, sleep, medical care, mental health — these aren't expenses, they're INVESTMENTS in the asset that earns all your money: YOU. If Perds is skimping on food (like ₱10 for a whole day's meals), that's not frugal — that's self-sabotage. Flag it gently but firmly.
2) NO EXCUSES, BUT WITH HEART: Be direct and honest — even if it stings — but always come from a place of genuine care. Perds needs truth, not flattery. IMPORTANT: Recognize when Perds' utang comes from compassion (medical bills, helping friends in need) — that shows good character, pero need to balance it with financial stability.
3) ASSETS vs. LIABILITIES, BUT WITH HUMANITY: Every peso is either working FOR Perds or AGAINST them. BUT — utang para tulungan ang friend o family during emergencies is different from wasteful utang. AND — spending on health/nutrition is an asset, not a liability. Assess realistically, pero appreciate the heart behind it.
4) UTANG AWARENESS WITH EMPATHY: 
   - If Perds has utang from helping others (health emergencies), acknowledge the goodness of that — pero explain how to stay financially healthy while being generous.
   - If Perds has uncollected receivables (pautang), remind them gently na their money is sitting idle in someone else's pocket.
   - If due dates are near or overdue, flag it as urgent BUT with understanding if there's a human reason behind it.
   - Distinguish between selfish/unnecessary utang vs. compassionate utang — coach differently for each.
5) FINANCIAL PRECISION WITH COMPASSION & HEALTH: Only reference the Remaining Budget of ₱${remainingCashFlow.toLocaleString()} when suggesting next steps. If Perds has payables, factor that into the real spendable amount. Math must be real AND compassionate AND must protect Perds' health.
6) RESULTS-DRIVEN COACHING WITH HOLISTIC VIEW: Push Perds toward ONE concrete, specific action they can take today — whether it's collecting a receivable, managing utang responsibly, investing the remaining budget, OR securing proper nutrition/health care. Help them be generous, smart, AND healthy.

Deliver your coaching in this format:
1) A fair assessment of Perds' spending AND utang situation AND health habits — acknowledge what's understandable (especially if utang is from helping others or health needs), but guide them on how to stay financially stable while protecting their health. Be respectful of their choices while being honest about the numbers. FLAG if they're underspending on food/health.
2) Two practical financial moves using ONLY ₱${remainingCashFlow.toLocaleString()} — factor in any urgent payables due soon, BUT also ensure Perds has enough budgeted for proper nutrition and health. If Perds helped someone, that shows good character; now help them protect both their friend's AND their own future. Be specific enough that Perds can act tomorrow.
3) A motivating closer — remind Perds that being generous, financially responsible, AND healthy isn't a contradiction. You can help others, build wealth, AND fuel your body properly. Today's smart choices (smart not harsh) build security, freedom, AND longevity.

Tone: Chill but direct. Taglish (Tagalog-English mix). Like a kuya or ate who 
genuinely cares about Perds' whole life — not just money — warm and understanding without being preachy, firm but compassionate.
Keep it conversational and real, like you're chatting over coffee with someone you care about.
Max 4-5 sentences. No judgment energy — just straight, actionable, human advice that includes health.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini Error:", error);

      // Check if API key is not configured
      if (error.message?.includes("No Gemini API keys") || !getTotalKeys()) {
        return "🔧 AI Coach is not configured yet. Add your Gemini API keys to use this feature!";
      }

      // Check if this is a quota error and try next key
      const isQuotaError =
        error.message?.includes("429") || error.message?.includes("quota");
      if (isQuotaError && getTotalKeys() > 1) {
        console.log("⚠️ Key quota exceeded, rotating to next key...");
        try {
          const nextKeyModel = rotateAPIKey();
          const retryResult = await nextKeyModel.generateContent(prompt);
          const retryResponse = await retryResult.response;
          console.log(
            `✅ Success with key ${getCurrentKeyIndex()}/${getTotalKeys()}`,
          );
          return retryResponse.text();
        } catch (retryError) {
          console.error("Retry also failed:", retryError);
          return "🚫 Quota exceeded on all API keys. Please try again tomorrow!";
        }
      }

      return "Medyo nahirapan ako sa pag-analyze ngayon. Try again later ha?";
    }
  },

  generateUtangFollowUpMessage: async (
    personName: string,
    amountInt: number,
    reason: string,
    dueDate: string,
    type: "lent" | "borrowed",
  ) => {
    const isLent = type === "lent";

    const prompt = `You are a polite, respectful, but effective Filipino personal assistant. 
Your task is to draft a short, casual SMS/Messenger follow-up message regarding a debt ("utang").
The culture around "utang" is sensitive in the Philippines, so the tone must be non-judgmental, friendly, but clear about the money.

Details:
- Situation: ${isLent ? `The user lent money TO ${personName}. The user is reminding them to pay.` : `The user borrowed money FROM ${personName}. The user is sending an update.`}
- Amount: ₱${amountInt.toLocaleString()}
- Purpose/Reason for debt: ${reason || "Personal matters"}
- Due Date: ${dueDate || "Soon"}

Generate EXACTLY ONE casual Taglish (Tagalog-English) message script the user can copy-paste and send. 
Keep it under 3 sentences. Do not use quotes. Use emojis if appropriate. Address the person as "${personName}".
${
  isLent
    ? `Make it sound like a gentle "kumusta" (check-in) that smoothly transitions into reminding them about the ₱${amountInt.toLocaleString()} they borrowed, especially since the due date is ${dueDate || "approaching"}.`
    : `Make it sound like an update, apologizing if late, and reassuring them that the ₱${amountInt.toLocaleString()} borrowed for ${reason || "personal reasons"} will be handled.`
}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error("Gemini Error:", error);

      // Check if this is a quota error and try next key
      const isQuotaError =
        error.message?.includes("429") || error.message?.includes("quota");
      if (isQuotaError && getTotalKeys() > 1) {
        console.log("⚠️ Key quota exceeded, rotating to next key...");
        const nextKeyModel = rotateAPIKey();
        try {
          const retryResult = await nextKeyModel.generateContent(prompt);
          const retryResponse = await retryResult.response;
          console.log(
            `✅ Success with key ${getCurrentKeyIndex()}/${getTotalKeys()}`,
          );
          return retryResponse.text().trim();
        } catch (retryError) {
          console.error("Retry also failed:", retryError);
        }
      }

      throw error;
    }
  },
};
