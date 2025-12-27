
import { GoogleGenAI } from "@google/genai";
import { NoteData } from "../types.ts";

const DRIVE_FOLDER_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";

const SYSTEM_INSTRUCTION = `
你是「MatSci.Processor」，一位專為材料科學考研設計的頂尖 AI 助教。

核心資源庫：
1. **雲端題庫 (Master Bank)**：你已獲得授權存取 Google Drive 資料夾 (ID: ${DRIVE_FOLDER_ID})。你必須以此資料夾內的考古題為出題基準。
2. **使用者教材**：結合使用者上傳的 PDF 內容進行針對性訓練。

教學核心邏輯：
1. **出題階段**：從題庫抽取或生成模擬題。
2. **評鑑階段**：對使用者的回答進行 0-100 分的評點。
3. **補救教學**：若回答錯誤，給出詳盡解析與公式，並立即生成「類似題」驗證。使用者必須答對類似題，才可進入下一個考點。
4. **語言風格**：專業、嚴肅、繁體中文。公式使用 LaTeX。
`;

let chatSession: any = null;

export const initializeChat = async (notes: NoteData, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("授權失敗：未提供 API Key。請在配置中心輸入您的 Google AI Studio Key。");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 使用 gemini-3-pro-preview 處理複雜 STEM 任務
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const parts: any[] = [];
    parts.push({ text: `[系統連結成功]: 已掛載雲端題庫。請根據教材內容，開始第一道題目測驗。` });

    for (const note of notes) {
      if (note.type === 'file' && note.mimeType === 'application/pdf') {
        parts.push({
          inlineData: { mimeType: 'application/pdf', data: note.content }
        });
      } else {
        parts.push({ text: `[教材內容]:\n${note.content}` });
      }
    }
  
    const result = await chatSession.sendMessage({ message: parts });
    return result.text || "助教已準備就緒。教材融合完成，請開始測驗。";
  } catch (error: any) {
    console.error("Gemini Init Critical Error:", error);
    let errorMsg = error.message || "初始化失敗";
    if (errorMsg.includes("401") || errorMsg.includes("API key")) {
        errorMsg = "金鑰驗證失敗 (401)。請檢查您的 API Key 是否正確且有效。";
    }
    throw new Error(errorMsg);
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("通訊模組未啟動。請先在配置中心完成初始化。");
  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "[系統無回應]";
  } catch (err: any) {
    console.error("Chat Error:", err);
    throw err;
  }
};
