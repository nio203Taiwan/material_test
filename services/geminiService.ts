
import { GoogleGenAI } from "@google/genai";
import { NoteData } from "../types.ts";

const DRIVE_FOLDER_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";

const SYSTEM_INSTRUCTION = `
你是「MatSci.Processor」，一位專為材料科學考研設計的頂尖 AI 助教。

核心資源庫：
1. **雲端題庫 (Master Bank)**：你已獲得授權存取 Google Drive 資料夾 (ID: ${DRIVE_FOLDER_ID})。你必須以此資料夾內的考古題為出題基準。
2. **使用者教材**：結合使用者上傳的 PDF 內容進行針對性訓練。如果上傳了多個檔案，請將它們視為同一部教材的連續單元。

教學核心邏輯 (嚴格執行)：
1. **出題階段**：從 Google Drive 題庫抽取與當前單元相關的題目，或根據上傳教材生成高質量模擬題。
2. **評鑑階段**：對使用者的回答進行 0-100 分的評點。
3. **補救教學 (關鍵)**：
   - 若使用者回答錯誤、不完整或表示「不知道」。
   - **[正確解析]**：必須立即給出詳盡的學理分析、公式推導（使用 LaTeX）。
   - **[類似題驗證]**：針對同一概念，立即從題庫或自行生成「類似題」。
   - **限制**：使用者必須答對類似題，你才被允許進入下一個考點。
4. **語言風格**：專業、嚴肅、使用繁體中文。公式必須以 LaTeX 呈現 (如：$n\\lambda = 2d\\sin\\theta$)。
`;

let chatSession: any = null;

/**
 * 根據規範，在每次對話初始化時重新建立實例，
 * 以確保獲取最新的 API Key (可能是付費金鑰)。
 */
export const initializeChat = async (notes: NoteData, initialUnit?: string): Promise<string> => {
  try {
    // CRITICAL: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) directly right before making a call to ensure current key usage.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Upgraded model to 'gemini-3-pro-preview' as it is recommended for complex STEM tasks requiring advanced reasoning.
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const parts: any[] = [];
    parts.push({ text: `[系統連結成功]: 已掛載雲端題庫。請根據當前單元「${initialUnit || '全章節'}」以及上傳的多分片教材內容，直接開始第一場專家級模擬測驗，請出第一道題目。` });

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
    // result.text is a property, correct usage.
    return result.text || "助教已準備就緒。教材融合完成，請開始測驗。";
  } catch (error: any) {
    console.error("Gemini Init Error:", error);
    throw error;
  }
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("通訊模組未啟動。");
  try {
    const response = await chatSession.sendMessage({ message });
    // response.text is a property, correct usage.
    return response.text || "[系統無回應]";
  } catch (err: any) {
    console.error("Chat Error:", err);
    throw err;
  }
};
