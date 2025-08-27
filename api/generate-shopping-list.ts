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
      objective,
      people,
      timePeriod,
    } = await req.json();

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: "Você é um nutricionista especialista e assistente de compras. Sua função é gerar uma lista de compras otimizada e estruturada em formato JSON, com base nas informações fornecidas. A lista deve ser prática, organizada por categorias e adequada para o número de pessoas e período informados. Não adicione nenhum texto ou formatação fora do JSON.",
    });

    const generationConfig = {
      temperature: 0.7,
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

    const prompt = `
    Gere uma lista de compras para ${people.length} pessoa(s) para um período de ${timePeriod}.

    **Informações:**
    - **Objetivo Principal:** ${objective}.
    - **Período:** ${timePeriod}.
    - **Detalhes das Pessoas:**
    ${peopleDetails}

    **Instrução:** Se a TMB (Taxa Metabólica Basal) for fornecida para uma pessoa, use essa informação para estimar com mais precisão as quantidades de alimentos necessários para atingir seus objetivos calóricos. Se não for fornecida, estime com base nas outras características.

    **Regras Estritas:**
    1.  **Culinária Brasileira:** Baseie a lista em alimentos comuns e acessíveis no Brasil.
    2.  **Organização:** Organize a lista de compras por categorias (ex: "Frutas", "Vegetais", "Proteínas", "Grãos e Cereais", "Laticínios", "Outros").
    3.  **Quantidades:** As quantidades devem ser estimadas para o número de pessoas e o período de tempo especificado. Use unidades de medida comuns (ex: kg, g, unidades, litros, etc.).
    4.  **JSON Válido:** A saída DEVE ser um objeto JSON válido, começando com "{" e terminando com "}". Não inclua nenhum texto ou formatação fora do JSON.

    **Formato de Saída (JSON):**
    {
      "lista_de_compras": [
        {
          "categoria": "<Nome da Categoria>",
          "itens": [
            {
              "item": "<Nome do Alimento>",
              "quantidade": "<Quantidade estimada, ex: '2kg' ou '5 unidades'>"
            }
          ]
        }
      ],
      "observacoes": "<Uma breve observação sobre a lista, como sugestões de economia ou armazenamento.>"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating shopping list:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate shopping list" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}