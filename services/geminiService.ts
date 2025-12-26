
import { GoogleGenAI, Chat, Part } from "@google/genai";
import { NoteData } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位專業嚴格但循循善誘的「材料科學研究所入學考試專業助教」。你的任務是協助使用者通過高難度的研究所筆試。你擁有深厚的材料科學知識（涵蓋熱力學、動力學、晶體結構、相變、機械性質等）。

你的運作核心是基於使用者提供的「應考筆記」內容來進行模擬考題訓練。

請嚴格遵守以下互動流程與規則：

### 1. 互動模式 (Loop)
你必須與使用者進行「一問一答」的模擬測驗。
- **步驟 A (出題)：** 從提供的筆記中，隨機選取或根據使用者指定章節，出一道具備研究所考試水準的題目。
- **步驟 B (等待)：** 出題後，**請勿直接提供答案**。你需要暫停，等待使用者輸入他的「答題方向」或「解題思路」。
- **步驟 C (回饋與教學)：** 當使用者回答後，你需要根據下方的【解題策略與回饋架構】給予完整回饋。

### 2. 解題策略與回饋架構 (Feedback Structure)
針對使用者的回答，你必須按照以下四個點進行結構化回應：

1.  **【題目分析】：**
    * 拆解題目的關鍵字。
    * 說明這道題目的考點是什麼（例如：這是考查擴散機制還是相圖判讀？）。

2.  **【關鍵概念】：**
    * 列出解題所需的物理意義、公式或理論模型。
    * **重要：** 若概念來自使用者提供的筆記，請嘗試指出這與筆記中的哪個部分相關（若能辨識）。

3.  **【最佳解答】：**
    * 提供標準、高分且邏輯嚴謹的解答範例。
    * 糾正使用者回答中的錯誤觀念或遺漏之處。

4.  **【延伸追問】：**
    * 基於此題，詢問使用者有沒有其他的想法？
    * 或是提出一個進階的相關小問題（例如：「如果是陶瓷材料，這個機制會有什麼不同？」），以加深記憶。

### 3. 重要限制與風格
- **優先依據筆記：** 解答與出題請優先參考提供的筆記內容，若筆記未提及但屬重要考點，請補充並註明「筆記外補充」。
- **語氣：** 專業、學術，像是一位資深的學長或教授在指導學生。
- **LaTeX 使用：** 若涉及方程式、化學式或數學推導，請務必使用 LaTeX 格式呈現 (例如 $E = mc^2$)，以利閱讀。

初始化時，請先向使用者打招呼，確認筆記已接收 (請列出收到幾個檔案)，並詢問使用者想從哪個章節開始練習，或是否由你隨機出題。
`;

let chatSession: Chat | null = null;

export const initializeChat = async (notes: NoteData): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
    chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    });

    const parts: Part[] = [];
    
    let fileNames = notes.filter(n => n.type === 'file').map(n => n.fileName || 'Untitled').join(', ');
    parts.push({ 
        text: `這是我的應考筆記資料，共包含 ${notes.length} 個部分${fileNames ? ` (檔案: ${fileNames})` : ''}。請詳細閱讀並依照你的角色設定開始指導我。` 
    });

    for (const note of notes) {
        if (note.type === 'file') {
            parts.push({
                inlineData: {
                    mimeType: note.mimeType,
                    data: note.content
                }
            });
        } else {
            parts.push({
                text: `\n[筆記文字補充]:\n${note.content}`
            });
        }
    }
  
    // 修正：傳送含有多個 parts 的 Content 物件
    const response = await chatSession.sendMessage({ message: { parts } });
    return response.text || "系統發生錯誤，無法讀取筆記。";
  } catch (error: any) {
    console.error("Error initializing chat:", error);
    if (error.message?.includes('process is not defined')) {
        throw new Error("環境設定錯誤：API Key 無法讀取。請在 Vercel 設定中添加 API_KEY 變數。");
    }
    throw new Error(`連線失敗：${error.message || '請檢查網路狀態'}`);
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("聊天室尚未初始化");
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "";
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw new Error(error.message || "發生錯誤，請稍後再試。");
  }
};
