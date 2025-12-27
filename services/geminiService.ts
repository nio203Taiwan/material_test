import { GoogleGenAI } from "https://esm.sh/@google/genai@0.12.0";
import { NoteData } from "../types.ts";

const SYSTEM_INSTRUCTION = `
你是一位專業嚴格但循循善誘的「材料科學研究所入學考試專業助教」。
你具備深厚的材料熱力學、動力學、相圖、晶體結構與機械性質等知識儲備。

核心行為準則：
1. **嚴謹性**：如果使用者的回答在理論或邏輯上有微小瑕疵，請毫不留情地指出，並要求使用者修正。
2. **循循善誘**：不要直接給出完整解答。當使用者卡住時，提供提示或基礎公式，引導他們推導出結果。
3. **格式化**：使用 Markdown 輸出。複雜公式請使用 LaTeX 格式。
4. **工業風語氣**：使用「系統指令」、「模組損壞」、「核心解析中」等語彙來回應。

工作流程：
- 根據上傳的筆記內容出題（一次一題）。
- 審核答案，給予 0-100 的精確評分。
- 只有當使用者完全掌握該觀點後，才進入下一個考點。
`;

let chatSession: any = null;

export const initializeChat = async (notes: NoteData, initialUnit?: string): Promise<string> => {
  const apiKey = (window as any).process?.env?.API_KEY || (process as any).env.API_KEY;
  
  if (!apiKey) {
    throw new Error("環境變數中缺少 API_KEY。");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
  
    chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    });

    const parts: any[] = [];
    parts.push({ text: `筆記載入完成。啟動單元：${initialUnit || '全部章節'}。請根據教材出題並進行評估。` });

    for (const note of notes) {
        if (note.type === 'file') {
            parts.push({
                inlineData: { mimeType: note.mimeType, data: note.content }
            });
        } else {
            parts.push({ text: `\n[筆記文本]:\n${note.content}` });
        }
    }
  
    const result = await chatSession.sendMessage({ message: { parts } });
    const text = typeof result.text === 'string' ? result.text : String(result.text || "");
    return text || "助教已就緒，請開始作答。";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`初始化失敗: ${error.message}`);
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("通訊模組未初始化");
  try {
    const response = await chatSession.sendMessage({ message });
    return typeof response.text === 'string' ? response.text : String(response.text || "");
  } catch (err: any) {
    return `[COMM_ERROR]: 傳輸失敗 - ${err.message}`;
  }
};