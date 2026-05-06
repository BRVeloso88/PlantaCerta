import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface PlantAnalysis {
  species: {
    commonName: string;
    scientificName: string;
    description: string;
  };
  hydration: {
    status: string;
    recommendation: string;
  };
  diseases: Array<{
    name: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    treatment: string;
  }>;
  generalCare: string;
}

const SYSTEM_PROMPT = `Você é um especialista em botânica e fitopatologia altamente preciso. 
Sua tarefa é analisar imagens de folhas de plantas e fornecer um diagnóstico detalhado.
O diagnóstico deve ser dividido em três camadas:
1. Identificação da Espécie: Nome comum e científico, com uma breve descrição.
2. Diagnóstico Hídrico: Avaliação do estado de hidratação (ex: bem hidratada, murcha, excesso de água) e recomendações práticas de rega.
3. Detecção de Doenças: Identificação de anomalias visuais como pragas, fungos, deficiências nutricionais ou outras patologias. Para cada problema encontrado, indique a gravidade e orientações de tratamento.

IMPORTANTE: Se a planta não apresentar nenhum sinal de doença, praga ou deficiência, o campo "diseases" deve ser um array vazio e você deve indicar claramente no campo "generalCare" que a planta está saudável.

Se a imagem não for de uma planta ou folha, indique isso claramente no campo de descrição da espécie.

Retorne o resultado estritamente em formato JSON.`;

export async function analyzePlantImage(base64Image: string): Promise<PlantAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      {
        parts: [
          { text: "Analise esta planta e forneça o diagnóstico completo conforme as instruções." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          species: {
            type: Type.OBJECT,
            properties: {
              commonName: { type: Type.STRING },
              scientificName: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["commonName", "scientificName", "description"],
          },
          hydration: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ["status", "recommendation"],
          },
          diseases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                treatment: { type: Type.STRING },
              },
              required: ["name", "type", "severity", "treatment"],
            },
          },
          generalCare: { type: Type.STRING },
        },
        required: ["species", "hydration", "diseases", "generalCare"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao processar resposta do Gemini:", error);
    throw new Error("Falha ao analisar a imagem da planta.");
  }
}
