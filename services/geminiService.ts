
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsight = async (
  currentBudget: number,
  expenses: any[],
  query: string
): Promise<string> => {
  if (!navigator.onLine) {
    return "عذراً، خدمة المساعد الذكي غير متوفرة أثناء انقطاع الاتصال بالإنترنت.";
  }
  try {
    const prompt = `
      أنت مساعد مالي ذكي لتطبيق إدارة صندوق مالي.
      الميزانية الحالية: ${currentBudget} ريال.
      آخر المصروفات: ${JSON.stringify(expenses.slice(0, 5))}.
      
      السؤال: ${query}
      
      أجب باللغة العربية بأسلوب مهني ومختصر ومفيد. قدم نصيحة بناءً على البيانات.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "عذراً، لم أتمكن من تحليل البيانات حالياً.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};

export const analyzeReceiptImage = async (base64Image: string): Promise<any> => {
  if (!navigator.onLine) {
    return null;
  }
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                }
            },
            {
                text: "قم باستخراج البيانات التالية من الإيصال: المبلغ الإجمالي، اسم المستفيد، التاريخ، والتصنيف (وقود، إعاشة، صيانة، أخرى). أرجع النتيجة بتنسيق JSON فقط."
            }
        ],
        config: {
            responseMimeType: "application/json"
        }
      });
      
      return JSON.parse(response.text || "{}");
  } catch (error) {
      console.error("Receipt Analysis Error", error);
      return null;
  }
}
