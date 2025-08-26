import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-pro"; // ou "gemini-2.0-flash"
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

    // Configuração otimizada para Gemini 2.5 Pro
    const generationConfig = {
      temperature: 0.7, // Reduzido para mais consistência
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096, // Aumentado para evitar truncamento
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

**IMPORTANTE:** Retorne APENAS o JSON válido, sem texto adicional.

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
      "macros": {"protein": 0, "carbs": 0, "fat": 0}
    }]
  }],
  "validation": {
    "meets_minimum": true,
    "within_limit": true,
    "balanced": true
  }
}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    
    // Verificação melhorada da resposta
    if (!response || !response.text) {
      throw new Error("Empty response from Gemini API");
    }

    let text = response.text().trim();
    
    // Limpeza mais robusta
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^[^{]*/, "") // Remove qualquer texto antes do primeiro {
      .replace(/[^}]*$/, "") // Remove qualquer texto após o último }
      .trim();

    // Validação se é JSON válido
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw text:", text);
      
      // Fallback: tenta extrair JSON válido
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          throw new Error("Invalid JSON response from Gemini API");
        }
      } else {
        throw new Error("No valid JSON found in response");
      }
    }

    // Validação estrutural do JSON
    if (!parsedResponse.total_calories || !parsedResponse.meals) {
      throw new Error("Invalid response structure");
    }

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("Error generating nutrition plan:", error);
    
    // Log detalhado para debug
    if (error.message?.includes("JSON")) {
      console.error("This appears to be a JSON parsing issue with Gemini 2.5 Pro");
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate nutrition plan",
        details: error.message,
        suggestion: "Try switching to gemini-2.0-flash if the issue persists"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
