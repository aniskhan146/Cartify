import { GoogleGenAI, Type } from "@google/genai";
import type { Product } from '../types';

const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error(
    "Google AI API key is not set in environment variables (API_KEY). AI features will be disabled and return mock data."
  );
}

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  if (!ai) {
    // Return a mock response if API key is not available
    return `This is a mock description for ${productName}. Keywords: ${keywords}. It highlights key features and benefits to attract customers. In a real application with a valid API key, this would be a high-quality, AI-generated description.`;
  }

  try {
    const prompt = `Generate a compelling and concise e-commerce product description for a product named "${productName}". 
    Incorporate the following keywords: "${keywords}". 
    The description should be marketing-focused, highlighting key benefits for the customer. 
    Keep it under 100 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating product description:", error);
    throw new Error("Failed to generate description from AI. Please try again.");
  }
};

export const identifyImage = async (base64ImageData: string): Promise<string> => {
    if (!ai) {
        // Return a mock response if API key is not available
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        return "This is a mock identification. In a real application, the AI would describe the object captured by the camera. For example: 'A pair of stylish, modern wireless headphones with a sleek black finish, perfect for immersive audio experiences.'";
    }

    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64ImageData,
            },
        };
        const textPart = {
            text: 'Identify the main object in this image. Provide a brief, engaging description suitable for an e-commerce platform, as if you were a helpful shopping assistant.'
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error identifying image with Gemini:", error);
        throw new Error("Failed to identify the image using AI. Please try again.");
    }
};

export const generateProductImage = async (prompt: string): Promise<string> => {
    if (!ai) {
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 2000));
        // A simple 1x1 red pixel as a placeholder for a base64 image
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    }
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, clean e-commerce product photo of: ${prompt}. White background, studio lighting.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("AI did not return an image.");
        }
    } catch (error) {
        console.error("Error generating product image:", error);
        throw new Error("Failed to generate image from AI.");
    }
};

const addProductTool = {
    name: 'addProduct',
    description: 'Adds a new product to the e-commerce store inventory.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'The name of the product.' },
            category: { type: Type.STRING, description: 'The category the product belongs to.' },
            price: { type: Type.NUMBER, description: 'The selling price of the product.' },
            stock: { type: Type.INTEGER, description: 'The number of items in stock.' },
        },
        required: ['name', 'category', 'price', 'stock'],
    },
};

const generateImageForProductTool = {
    name: 'generateImageForProduct',
    description: 'Generates a product image based on a description. This should be the first step before adding a new product if the user requests an image.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            productName: { type: Type.STRING, description: 'The name of the product to generate an image for.' },
            promptDetails: { type: Type.STRING, description: 'Additional details for the image prompt, e.g., "a red leather wallet with gold stitching".' },
        },
        required: ['productName', 'promptDetails'],
    },
};

const generateProductDescriptionTool = {
    name: 'generateProductDescription',
    description: 'Generates a compelling e-commerce product description based on a product name and keywords.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            productName: { type: Type.STRING, description: 'The name of the product.' },
            keywords: { type: Type.STRING, description: 'Comma-separated keywords to include (e.g., waterproof, leather, durable).' },
        },
        required: ['productName', 'keywords'],
    },
};

export const getAiAssistantResponse = async (
  prompt: string,
  history: any[],
  storeData: { products: Product[]; orders: any[]; users: any[] },
  viewContext?: { products: Product[] }
): Promise<string | { functionCall: any }> => {
  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 1500));
     if (prompt.toLowerCase().includes('add')) {
        return "Mock response: Sure, I can add that product for you. Confirmation: Product 'Premium Wallet' has been added.";
    }
    return `This is a mock AI response to your query: "${prompt}". In a real environment, I would analyze your store data to provide a detailed and accurate answer.`;
  }

  try {
    const isFilteredView = viewContext && viewContext.products.length < storeData.products.length;

    const systemInstruction = `You are "Cartify AI", a helpful e-commerce assistant for the admin of an online store called Cartify. 
    Your role is to analyze the provided store data (products, orders, users) to answer questions and help with management tasks.
    You have three main capabilities (tools):
    1. generateProductDescription: Use this to create a marketing-focused product description based on a product name and keywords.
    2. generateImageForProduct: Use this when the user asks you to create a product *with an image*. This is the first step. You generate the image, the user will approve it, and then they will fill in the rest of the product details manually in a form. Do not ask to add the product after generating the image; just generate the image.
    3. addProduct: Use this to add a product to the inventory *without* an image. Only use it when you have all required details (name, category, price, stock).
    Be concise, helpful, and professional.
    
    Current store data is provided below as JSON. Do not mention that you are using JSON data in your response. Just use the data to answer the user's question.
    
    Full Store Data:
    ${JSON.stringify(storeData, null, 2)}
    
    ${isFilteredView ? `
    IMPORTANT CONTEXT: The user is currently viewing a specific, filtered list of products on their screen. When their question seems to relate to what they are seeing (e.g., "how many of these...", "what is the value of the displayed items?", "which of these are on sale?"), you MUST prioritize using the 'Currently Viewed Products' data below for your answer. For broader questions about all products, use the 'Full Store Data'.

    Currently Viewed Products:
    ${JSON.stringify(viewContext.products, null, 2)}
    ` : ''}`;
    
    const mappedHistory = history.map(h => ({
         ...h, 
         role: h.role === 'assistant' ? 'model' : 'user' 
    }));
    
    if (prompt) {
        mappedHistory.push({ role: 'user', parts: [{ text: prompt }] });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: mappedHistory,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [addProductTool, generateImageForProductTool, generateProductDescriptionTool] }],
        },
    });
    
    if (response.functionCalls && response.functionCalls.length > 0) {
        return { functionCall: response.functionCalls[0] };
    }
    
    return response.text;
  } catch (error) {
    console.error("Error getting AI assistant response:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};