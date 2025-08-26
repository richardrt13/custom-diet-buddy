import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  InlineDataPart,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GEMINI_API_KEY as string;

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const {
      patientName,
      maxCalories,
      mealType,
      macroPriority,
      selectedFoods,
      observations,
    } = await req.json();

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
    ];

    const prompt = `
    Você é um nutricionista especialista em culinária brasileira. Crie um plano alimentar para "${patientName}" que atinja OBRIGATORIAMENTE 85-100% de ${maxCalories} calorias (${Math.floor(maxCalories * 0.85)}-${maxCalories} cal).
    
    **PARÂMETROS:**
    - Tipo: ${mealType}
    - Macro prioritário: ${macroPriority}  
    - Alimentos: ${selectedFoods.join(", ")}
    - Observações: ${observations}
    
    **REGRAS:**
    
    1. **CALORIAS:** Total entre ${Math.floor(maxCalories * 0.85)}-${maxCalories}. Se abaixo de 85%, AJUSTE para cima.
    
    2. **DISTRIBUIÇÃO (tipo "all"):** Café 20-25%, Almoço 30-35%, Lanche 10-15%, Jantar 25-30%
    
    3. **COMPOSIÇÃO POR REFEIÇÃO:**
       - **Café:** pão/tapioca/bolo + ovo/leite/queijo + café/suco. NÃO: arroz, feijão, salada
       - **Almoço/Jantar:** arroz/macarrão + carne/frango/peixe + salada/legumes
       - **Lanche:** fruta/iogurte/pão pequeno. NÃO: pratos completos
    
    4. **AJUSTES:** Carboidrato +25-50g, Proteína +20-30g, Azeite +1-2 col. Quantidades realistas.
    
    **FORMATO JSON (OBRIGATÓRIO - JSON VÁLIDO APENAS):**
    {
      "total_calories": 1800,
      "calories_percentage": 95.5,
      "meals": [
        {
          "type": "breakfast",
          "subtotal_calories": 400,
          "foods": [
            {
              "name": "Pão integral",
              "preparation": "torrado",
              "quantity": "2 fatias",
              "calories": 160,
              "macros": {"protein": 6, "carbs": 30, "fat": 2}
            }
          ]
        }
      ],
      "validation": {
        "meets_minimum": true,
        "within_limit": true,
        "balanced": true
      }
    }
    
    IMPORTANTE: Retorne APENAS JSON válido, sem texto antes ou depois. Use números reais, não palavras.
    
    Use apenas alimentos listados. Especifique preparo. Respeite cultura brasileira.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Limpa a resposta para garantir que seja um JSON válido
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return new Response(cleanedText, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating nutrition plan:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate nutrition plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
