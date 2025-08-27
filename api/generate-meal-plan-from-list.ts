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
      shoppingList,
      people,
      timePeriod,
      objective
    } = await req.json();

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: "Você é um nutricionista experiente. Sua tarefa é criar um plano alimentar detalhado para múltiplas pessoas, usando APENAS os ingredientes de uma lista de compras fornecida. O plano deve ser estruturado em JSON e personalizado para cada indivíduo.",
    });

    const generationConfig = {
      temperature: 0.8,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
    
    const peopleDetails = people.map((p: any, index: number) => {
      let personString = `Pessoa ${index + 1}: Gênero ${p.gender}, ${p.weight}kg, ${p.height}cm, ${p.age} anos.`;
      if (p.tmb && p.tmb.trim() !== "") {
          personString += ` TMB de ${p.tmb} kcal.`;
      }
      return personString;
    }).join('\n');

    const shoppingListText = JSON.stringify(shoppingList.lista_de_compras, null, 2);

    const prompt = `
    **Objetivo:** Criar um plano alimentar para ${people.length} pessoa(s) durante ${timePeriod}.

    **Contexto:**
    - **Objetivo Geral:** ${objective}.
    - **Período:** ${timePeriod}.
    - **Indivíduos:**
    ${peopleDetails}

    **Recurso Exclusivo (Lista de Compras):**
    Utilize SOMENTE os itens da lista de compras abaixo. Seja criativo para combinar os ingredientes e evitar desperdício.
    \`\`\`json
    ${shoppingListText}
    \`\`\`

    **Regras Estritas:**
    1.  **Restrição de Ingredientes:** NÃO use nenhum ingrediente que não esteja na lista de compras fornecida.
    2.  **Plano Individual:** Crie um plano alimentar separado para cada pessoa, ajustando as porções e calorias de acordo com suas características (peso, altura, idade, gênero) e o objetivo principal.
    3.  **Regra da TMB (MAIS IMPORTANTE):** Se a TMB de uma pessoa for fornecida, o total de calorias diárias do plano alimentar para essa pessoa DEVE ficar entre 85% e 105% do valor da TMB. Por exemplo, para uma TMB de 2000 kcal, o plano diário deve ter entre 1700 e 2100 kcal. Calcule e inclua o total de calorias diárias no JSON. Se a TMB não for fornecida, estime as calorias com base no objetivo e nas características físicas.
    4.  **Estrutura Diária:** Para cada dia, detalhe as refeições (Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar).
    5.  **Formato JSON:** A saída DEVE ser um objeto JSON válido, começando com "{" e terminando com "}". Não inclua nenhum texto ou formatação fora do JSON.
    6.  **Quantidades e Medidas:** Use medidas precisas como gramas (g), quilogramas (kg), mililitros (ml) ou unidades (ex: "1 unidade", "2 fatias").
    7.  **Culinária Brasileira:** Baseie as refeições em pratos comuns no Brasil.

    **Formato de Saída (JSON):**
    {
      "planos_alimentares": [
        {
          "pessoa": "Pessoa 1",
          "descricao_pessoa": "Gênero masculino, 70kg, 175cm, 30 anos, TMB 1800 kcal",
          "objetivo_individual": "Descrição do objetivo ajustado para esta pessoa.",
          "plano_diario": [
            {
              "dia": "Dia 1",
              "total_calorias_aproximadas": 1780,
              "refeicoes": [
                { "nome": "Café da Manhã", "descricao": "Ex: Omelete de 2 ovos com queijo e uma fatia de pão integral.", "calorias_aproximadas": 350 },
                { "nome": "Almoço", "descricao": "Ex: 150g de frango grelhado, 100g de arroz, salada de alface e tomate.", "calorias_aproximadas": 500 },
                { "nome": "Jantar", "descricao": "Ex: Sopa de legumes com pedaços de carne.", "calorias_aproximadas": 400 }
              ]
            }
          ]
        }
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating meal plan:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate meal plan" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}