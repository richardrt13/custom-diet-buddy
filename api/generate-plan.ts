import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
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
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: "Você é um nutricionista especialista em culinária brasileira e na criação de planos alimentares detalhados. Sua principal função é gerar um plano alimentar em formato JSON válido, seguindo estritamente as diretrizes e regras fornecidas no prompt do usuário. Não adicione nenhum texto ou formatação fora do JSON.",
    });

    const generationConfig = {
      temperature: 0.8,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
       {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // MODIFICAÇÃO PRINCIPAL: Lógica condicional para o prompt
    let prompt;

    if (mealType === "all") {
      prompt = `
      Crie um plano alimentar completo para "${patientName}".

      **Diretrizes:**
      - **Calorias-alvo:** O total de calorias deve estar entre 85% e 100% de ${maxCalories} kcal (ou seja, entre ${Math.floor(maxCalories * 0.85)} e ${maxCalories} kcal).
      - **Tipo de Refeição:** Todas as refeições do dia. Distribua as calorias entre Café da Manhã (20-25%), Lanche da Manhã (5-10%), Almoço (30-35%), Lanche da Tarde (5-10%), Jantar (20-25%) e Ceia (0-5%, opcional).
      - **Prioridade de Macronutriente:** A dieta deve priorizar **${macroPriority}**.
      - **Alimentos Disponíveis:** Utilize **apenas** os seguintes alimentos: ${selectedFoods.join(", ")}.
      - **Observações Adicionais:** ${observations}.

      **Regras Estritas:**
      1.  **JSON Válido e Completo:** A saída DEVE ser um objeto JSON válido. Todos os campos são obrigatórios.
      2.  **Quantidades:** Use medidas precisas (gramas, ml, unidades).

      **Formato de Saída (JSON):**
      {
        "total_calories": <número>,
        "calories_percentage_of_max": <número>,
        "macros_summary": { "protein_g": <número>, "carbs_g": <número>, "fat_g": <número> },
        "meals": [
          { "type": "breakfast", "subtotal_calories": <número>, "foods": [...] },
          { "type": "morning_snack", "subtotal_calories": <número>, "foods": [...] },
          { "type": "lunch", "subtotal_calories": <número>, "foods": [...] },
          { "type": "afternoon_snack", "subtotal_calories": <número>, "foods": [...] },
          { "type": "dinner", "subtotal_calories": <número>, "foods": [...] },
          { "type": "supper", "subtotal_calories": <número>, "foods": [...] }
        ],
        "validation": { "meets_calorie_target": <true ou false>, "used_only_allowed_foods": <true ou false> }
      }
      `;
    } else {
      // Prompt original para refeições únicas
      prompt = `
      Crie um plano alimentar para "${patientName}".

      **Diretrizes:**
      - **Calorias-alvo:** O total de calorias deve estar entre 85% e 100% de ${maxCalories} kcal (ou seja, entre ${Math.floor(maxCalories * 0.85)} e ${maxCalories} kcal).
      - **Tipo de Refeição:** ${mealType}.
      - **Prioridade de Macronutriente:** A dieta deve priorizar **${macroPriority}**.
      - **Alimentos Disponíveis:** Utilize **apenas** os seguintes alimentos: ${selectedFoods.join(", ")}.
      - **Observações Adicionais:** ${observations}.

      **Regras Estritas:**
      1.  **JSON Válido e Completo:** A saída DEVE ser um objeto JSON válido. Todos os campos são obrigatórios.
      2.  **Quantidades:** Use medidas precisas (gramas, ml, unidades).

      **Formato de Saída (JSON):**
      {
        "total_calories": <número>,
        "calories_percentage_of_max": <número>,
        "macros_summary": { "protein_g": <número>, "carbs_g": <número>, "fat_g": <número> },
        "meals": [
          {
            "type": "${mealType}",
            "subtotal_calories": <número>,
            "foods": [
              {
                "name": "<nome do alimento>",
                "preparation": "<modo de preparo>",
                "quantity": "<quantidade>",
                "calories": <número>,
                "macros": { "protein": <número>, "carbs": <número>, "fat": <número> }
              }
            ]
          }
        ],
        "validation": { "meets_calorie_target": <true ou false>, "used_only_allowed_foods": <true ou false> }
      }
      `;
    }


    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "");

    return new Response(text, {
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