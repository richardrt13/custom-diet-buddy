import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  InlineDataPart,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-pro";
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
    Crie um plano alimentar brasileiro para "${patientName}".
    
    **META:** ${maxCalories} calorias (OBRIGATÓRIO: 85-100% = ${Math.floor(maxCalories * 0.85)}-${maxCalories} cal)
    **DADOS:** ${mealType} | Foco: ${macroPriority} | Alimentos: ${selectedFoods.join(", ")}
    **OBS:** ${observations}
    
    **REGRAS:**
    1. **Calorias:** Ajuste porções para atingir 85-100% do limite
    2. **Cultura BR:** 
       - Café: pão/tapioca + ovo/queijo/leite (NÃO arroz/feijão)
       - Almoço/Jantar: arroz/macarrão + proteína + salada/legumes
       - Lanche: fruta/iogurte/pão pequeno
    3. **Distribuição (se "all"):** Café 20-25%, Almoço 30-35%, Lanche 10-15%, Jantar 25-30%
    
    **JSON de resposta:**
    {
      "total_calories": número,
      "calories_percentage": percentual,
      "meals": [{
        "type": "breakfast|lunch|dinner|snack",
        "subtotal_calories": número,
        "foods": [{
          "name": "Nome",
          "preparation": "preparo",
          "quantity": "150g ou 2 unidades",
          "calories": número,
          "macros": {"protein": g, "carbs": g, "fat": g}
        }]
      }],
      "validation": {
        "meets_minimum": ${Math.floor(maxCalories * 0.85)} <= total <= ${maxCalories},
        "within_limit": total <= ${maxCalories},
        "balanced": true
      }
    }
    
    IMPORTANTE: Se total < ${Math.floor(maxCalories * 0.85)}, aumente porções proporcionalmente.
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
