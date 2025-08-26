// api/generate-plan.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY as string;

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { patientName, maxCalories, mealType, macroPriority, selectedFoods } = await req.json();

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      // ... (adicione outras configurações de segurança conforme necessário)
    ];

    const prompt = `
      Você é um nutricionista especialista. Crie um plano alimentar para o paciente "${patientName}".

      **Restrições e Preferências:**
      - Calorias Máximas: ${maxCalories}
      - Tipo de Refeição: ${mealType}
      - Prioridade de Macronutriente: ${macroPriority}
      - Alimentos Disponíveis: ${selectedFoods.join(', ')}

      **Formato da Resposta (JSON):**
      Responda estritamente com um objeto JSON com a seguinte estrutura:
      {
        "meals": [
          {
            "type": "breakfast" | "lunch" | "dinner" | "snack",
            "foods": [
              {
                "name": "Nome do Alimento",
                "quantity": "Quantidade (ex: 100g)",
                "calories": numero_de_calorias
              }
            ]
          }
        ]
      }

      **Instruções Adicionais:**
      - O total de calorias do plano não deve exceder ${maxCalories}.
      - Utilize apenas os alimentos fornecidos na lista de "Alimentos Disponíveis".
      - Se o tipo de refeição for "all", crie um plano para o dia todo (café da manhã, almoço, lanche, jantar).
      - Se for um tipo de refeição específico, crie apenas para essa refeição.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Limpa a resposta para garantir que seja um JSON válido
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(cleanedText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate nutrition plan' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
