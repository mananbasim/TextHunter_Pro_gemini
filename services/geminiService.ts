
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  // Always use a named parameter and the API_KEY environment variable directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };

  const textPart = {
    text: "Extract all text from this screenshot or image exactly as it appears. If there is multiple text, separate them with new lines. Return only the extracted text without any commentary or headers."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text || "No text found in the image.";
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Failed to extract text from the image.");
  }
};
