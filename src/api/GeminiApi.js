import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates a compelling, SEO-friendly product description using Gemini.
 * @param {string} title - The title of the product.
 * @param {string} category - The category of the product.
 * @returns {Promise<string>} The generated product description in HTML format.
 */
export const generateProductDescription = async (title, category) => {
    // Check for process object existence before trying to access it.
    if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
        console.error("API_KEY environment variable is not set or process is not defined.");
        throw new Error("Gemini API key is not configured. This feature is unavailable.");
    }

    if (!title || !category) {
        throw new Error("Product title and category are required to generate a description.");
    }
    
    // Initialize AI client here, lazily.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

        // Trim the response text to avoid parsing errors with leading/trailing whitespace.
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        return result.description;

    } catch (error) {
        console.error("Error generating product description with Gemini:", error);
        throw new Error("Failed to generate AI description. Please check the console for details.");
    }
};
