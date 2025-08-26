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
      // ... (adicione outras configurações de segurança conforme necessário)
    ];

    const prompt = `
    Você é um nutricionista especialista em cultura alimentar brasileira. Crie um plano alimentar para o paciente "${patientName}".

    **OBJETIVO PRINCIPAL:**
    Criar um plano alimentar que OBRIGATORIAMENTE atinja entre 85% e 100% do valor calórico máximo permitido (${maxCalories} calorias).

    **Restrições e Preferências:**
    - **META CALÓRICA:** ${maxCalories} calorias (IMPORTANTE: O plano deve somar NO MÍNIMO ${Math.floor(maxCalories * 0.85)} calorias e NO MÁXIMO ${maxCalories} calorias)
    - Tipo de Refeição: ${mealType}
    - Prioridade de Macronutriente: ${macroPriority}
    - Alimentos Disponíveis: ${selectedFoods.join(", ")}
    - Observações Adicionais: ${observations}

    **REGRAS OBRIGATÓRIAS:**

    1. **CALORIAS:** 
      - O total de calorias DEVE estar entre ${Math.floor(maxCalories * 0.85)} e ${maxCalories}
      - Se o primeiro cálculo ficar abaixo de 85%, AJUSTE as quantidades para cima
      - Priorize atingir o valor máximo sem ultrapassar

    2. **DISTRIBUIÇÃO CALÓRICA (quando tipo "all"):**
      - Café da manhã: 20-25% das calorias totais
      - Almoço: 30-35% das calorias totais  
      - Lanche: 10-15% das calorias totais
      - Jantar: 25-30% das calorias totais

    3. **COMPOSIÇÃO DAS REFEIÇÕES:**
      - Utilize APENAS os alimentos listados em "Alimentos Disponíveis"
      - Cada refeição principal deve conter:
        * 1 fonte de carboidrato (arroz, pão, batata, mandioca, fruta)
        * 1 fonte de proteína (frango, ovo, feijão, laticínios)
        * 1 acompanhamento (salada, legumes, café)
      - Especifique sempre o método de preparo (cozido, assado, grelhado)

    4. **AJUSTE DE QUANTIDADES:**
      - Se necessário aumentar calorias, ajuste proporcionalmente:
        * Carboidratos: aumente em 25-50g
        * Proteínas: aumente em 20-30g
        * Gorduras saudáveis: adicione 1-2 colheres de azeite
      - Use porções realistas e culturalmente apropriadas

    **Formato da Resposta (JSON):**
    {
      "total_calories": número_total_de_calorias_do_plano,
      "calories_percentage": percentual_em_relação_ao_máximo,
      "meals": [
        {
          "type": "breakfast" | "lunch" | "dinner" | "snack",
          "subtotal_calories": total_de_calorias_desta_refeição,
          "foods": [
            {
              "name": "Nome do Alimento",
              "preparation": "Forma de preparo",
              "quantity": "Quantidade (ex: 150g, 2 unidades médias)",
              "calories": numero_de_calorias,
              "macros": {
                "protein": gramas_de_proteína,
                "carbs": gramas_de_carboidrato,
                "fat": gramas_de_gordura
              }
            }
          ]
        }
      ],
      "validation": {
        "meets_minimum": boolean (true se >= 85% do máximo),
        "within_limit": boolean (true se <= máximo),
        "balanced": boolean (true se tem todos grupos alimentares)
      }
    }

    **VALIDAÇÃO FINAL:**
    Antes de retornar o JSON, verifique:
    1. ✓ Total de calorias está entre ${Math.floor(maxCalories * 0.85)} e ${maxCalories}?
    2. ✓ Todas as refeições estão balanceadas?
    3. ✓ As quantidades são realistas para consumo?
    4. ✓ Respeitou a cultura alimentar brasileira?

    Se o total estiver abaixo do mínimo, RECALCULE aumentando as porções proporcionalmente.

    **Observações do Paciente:** ${observations}
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