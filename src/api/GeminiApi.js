import { GoogleGenAI, Type } from "@google/genai";

let ai;

function getAiClient() {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable is not set.");
            throw new Error("Gemini API key is not configured. This feature is unavailable.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

/**
 * Generates a compelling, SEO-friendly product description using Gemini.
 * @param {string} title - The title of the product.
 * @param {string} category - The category of the product.
 * @returns {Promise<string>} The generated product description in HTML format.
 */
export const generateProductDescription = async (title, category) => {
    if (!title || !category) {
        throw new Error("Product title and category are required to generate a description.");
    }
    
    const client = getAiClient();

    const prompt = `
        You are a world-class e-commerce copywriter.
        Generate a compelling, SEO-friendly product description in HTML format for the following product.
        
        Product Title: "${title}"
        Product Category: "${category}"

        The description should be engaging, highlight potential benefits, and be formatted with paragraphs (<p> tags).
        Do not use headings (h1, h2, etc.).
        Keep it concise, around 2-3 paragraphs.
    `;
    
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "The generated HTML product description."
                        }
                    },
                    required: ["description"]
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        return result.description;

    } catch (error) {
        console.error("Error generating product description with Gemini:", error);
        throw new Error("Failed to generate AI description. Please check the console for details.");
    }
};


/**
 * Analyzes a natural language query and suggests search parameters.
 * @param {string} query - The user's natural language query (e.g., "a gift for my mom who loves gardening").
 * @param {string[]} availableCategories - An array of available product categories.
 * @returns {Promise<{searchTerm: string, category: string}>} The suggested search parameters.
 */
export const getSearchParamsFromNaturalLanguage = async (query, availableCategories) => {
    if (!query) {
        throw new Error("Query cannot be empty.");
    }

    const client = getAiClient();
    const categoriesString = availableCategories.join(', ');

    const prompt = `
        You are an intelligent shopping assistant for an e-commerce store.
        Your task is to analyze a user's natural language query and suggest the best search parameters.

        User Query: "${query}"
        
        Available Categories: [All, ${categoriesString}]

        Analyze the user's intent, identify key products or attributes, and determine the most relevant category.
        
        - The "searchTerm" should be a concise 2-4 word phrase that best captures the product the user is looking for.
        - The "category" must be one of the provided available categories. If no specific category fits well, choose "All".
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        searchTerm: {
                            type: Type.STRING,
                            description: "A concise search term for the product."
                        },
                        category: {
                            type: Type.STRING,
                            description: "The most relevant category from the available list."
                        }
                    },
                    required: ["searchTerm", "category"]
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // Validate the category returned by the AI
        if (!['All', ...availableCategories].includes(result.category)) {
            console.warn(`AI returned an invalid category: '${result.category}'. Defaulting to 'All'.`);
            result.category = 'All';
        }

        return result;

    } catch (error) {
        console.error("Error generating search parameters with Gemini:", error);
        throw new Error("The AI assistant could not process your request. Please try a different query.");
    }
};