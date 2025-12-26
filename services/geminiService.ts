import { GoogleGenAI, Chat, Part } from "@google/genai";
import { NoteData } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位專業嚴格但循循善誘的「材料科學研究所入學考試專業助教」。你的任務是協助使用者通過高難度的研究所筆試。你擁有深厚的材料科學知識（涵蓋熱力學、動力學、晶體結構、相變、機械性質等）。

你的運作核心是基於使用者提供的「應考筆記」內容來進行模擬考題訓練。

### 1. 互動模式 (Loop)
你必須與使用者進行「一問一答」的模擬測驗。
- **步驟 A (出題)：** 從提供的筆記中，隨機選取或根據使用者指定章節，出一道具備研究所考試水準的題目。
- **步驟 B (等待)：** 出題後，**請勿直接提供答案**。你需要暫停，等待使用者輸入他的「答題方向」或「解題思路」。
- **步驟 C (回饋與教學)：** 當使用者回答後，你需要根據下方的【解題策略與回饋架構】給予完整回饋。

### 2. 解題策略與回饋架構
1. 【題目分析】：拆解關鍵字與考點。
2. 【關鍵概念】：列出物理意義、公式或理論。
3. 【最佳解答】：提供標準、邏輯嚴謹的解答。
4. 【延伸追問】：提出進階相關問題。

### 3. 重要限制
- 優先參考筆記，若無則補充並註明。
- 語氣專業嚴肅。
- LaTeX 使用：數學公式必須使用 LaTeX，例如 $E = mc^2$。
`;

let chatSession: Chat | null = null;

export const initializeChat = async (notes: NoteData): Promise<string> => {
  // 透過全域 window.process 確保在瀏覽器環境中不會報錯
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("找不到 API_KEY 環境變數。請確認專案設定中已正確注入金鑰。");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
  
    chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    });

    const parts: Part[] = [];
    let fileNames = notes.filter(n => n.type === 'file').map(n => n.fileName || 'Untitled').join(', ');
    
    parts.push({ 
        text: `這是我的應考筆記資料，共包含 ${notes.length} 個部分${fileNames ? ` (檔案: ${fileNames})` : ''}。請開始指導。` 
    });

    for (const note of notes) {
        if (note.type === 'file') {
            parts.push({
                inlineData: { mimeType: note.mimeType, data: note.content }
            });
        } else {
            parts.push({ text: `\n[筆記文字補充]:\n${note.content}` });
        }
    }
  
    const response = await chatSession.sendMessage({ message: { parts } });
    return response.text || "助教已成功加載，隨時可以開始。";
  } catch (error: any) {
    console.error("Gemini Init Error:", error);
    throw new Error(`系統初始化失敗: ${error.message || '未知錯誤'}`);
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("通訊模組尚未初始化");
  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Send Error:", error);
    throw new Error(`訊息傳送失敗: ${error.message}`);
  }
};