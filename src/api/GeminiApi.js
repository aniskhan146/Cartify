import { GoogleGenAI, Type } from "@google/genai";

// Ensure the API key is available from environment variables.
if (!process.env.API_KEY) {
    // This check is important for development, but in a production environment,
    // the key should always be present.
    console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
     if (!process.env.API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }

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
        const response = await ai.models.generateContent({
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

        const jsonString = response.text;
        const result = JSON.parse(jsonString);

        return result.description;

    } catch (error) {
        console.error("Error generating product description with Gemini:", error);
        throw new Error("Failed to generate AI description. Please check the console for details.");
    }
};
