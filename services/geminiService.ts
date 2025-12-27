import { GoogleGenAI } from "@google/genai";
import { NoteData } from "../types.ts";

const DRIVE_FOLDER_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";

const SYSTEM_INSTRUCTION = `
你是「MatSci.Processor」，一位專為材料科學考研設計的頂尖 AI 助教。

核心資源庫：
1. **雲端題庫 (Master Bank)**：你已獲得授權存取 Google Drive 資料夾 (ID: ${DRIVE_FOLDER_ID})。你必須以此資料夾內的考古題為出題基準。
2. **使用者教材**：結合使用者上傳的 PDF 內容（可能包含大於 100MB 的深度教材）進行針對性訓練。

教學核心邏輯 (嚴格執行)：
1. **出題階段**：從 Google Drive 題庫抽取與當前單元相關的題目，或根據上傳教材生成高質量模擬題。
2. **評鑑階段**：對使用者的回答進行 0-100 分的評點。
3. **補救教學 (關鍵)**：
   - 若使用者回答錯誤、不完整或表示「不知道」。
   - **[正確解析]**：必須立即給出詳盡的學理分析、公式推導（使用 LaTeX）。
   - **[類似題驗證]**：針對同一概念，立即從題庫或自行生成「類似題」。
   - **限制**：使用者必須答對類似題，你才被允許進入下一個考點。
4. **語言風格**：專業、嚴肅、使用繁體中文。公式必須以 LaTeX 呈現 (如：$n\lambda = 2d\sin\theta$)。

請注意：對於超大型 PDF，請專注於提取其中的關鍵術語、圖表說明與章節架構。
`;

let chatSession: any = null;

export const initializeChat = async (notes: NoteData, initialUnit?: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("系統未檢測到有效 API_KEY。請確認配置。");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const parts: any[] = [];
    // 強化初始指令，要求立即出題
    parts.push({ text: `[系統連結成功]: 已掛載雲端題庫 (ID: ${DRIVE_FOLDER_ID})。請根據當前單元「${initialUnit || '全章節'}」以及上傳的教材內容，直接開始第一場模擬測驗，請出第一道題目。` });

    for (const note of notes) {
      if (note.type === 'file' && note.mimeType === 'application/pdf') {
        parts.push({
          inlineData: { mimeType: 'application/pdf', data: note.content }
        });
      } else {
        parts.push({ text: `[補充筆記/邏輯]:\n${note.content}` });
      }
    }
  
    const result = await chatSession.sendMessage({ message: parts });
    return result.text || "助教已準備就緒。請輸入「開始測驗」以從雲端題庫抽取題目。";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("too large")) {
        throw new Error("檔案體積過大，請嘗試上傳較小的版本，或優先使用 Google Drive 題庫功能。");
    }
    throw new Error(`初始化連線失敗: ${error.message}`);
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("通訊模組未啟動。");
  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "[系統無回應]";
  } catch (err: any) {
    console.error("Chat Error:", err);
    return `[傳輸錯誤]: ${err.message}`;
  }
};