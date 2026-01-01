import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

export const analyzeLotImage = async (base64Image: string): Promise<string> => {
  try {
    // Remove header data if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: 'Analise esta imagem de um item de leilÃ£o. ForneÃ§a uma descriÃ§Ã£o curta e objetiva (mÃ¡ximo 2 frases) sobre o que Ã© o item, condiÃ§Ã£o aparente e caracterÃ­sticas visuais principais. Responda em PortuguÃªs do Brasil.'
          }
        ]
      }
    });

    return response.text || "NÃ£o foi possÃ­vel analisar a imagem.";
  } catch (error) {
    console.error("Erro ao analisar imagem com Gemini:", error);
    return "Erro ao conectar com a IA para anÃ¡lise.";
  }
};