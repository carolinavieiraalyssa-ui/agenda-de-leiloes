import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            text: 'Analise esta imagem de um item de leilão. Forneça uma descrição curta e objetiva (máximo 2 frases) sobre o que é o item, condição aparente e características visuais principais. Responda em Português do Brasil.'
          }
        ]
      }
    });

    return response.text || "Não foi possível analisar a imagem.";
  } catch (error) {
    console.error("Erro ao analisar imagem com Gemini:", error);
    return "Erro ao conectar com a IA para análise.";
  }
};