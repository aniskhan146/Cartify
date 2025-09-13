import { GoogleGenAI, Type, Content } from "@google/genai";
import type { Product, Order, UserRoleInfo, Variant, CheckoutConfig } from '../types';

// Initialize the Google AI client directly in the browser.
// The API_KEY is expected to be available in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function for consistent error handling.
const handleError = (error: any, functionName: string): Error => {
  console.error(`Error in Gemini service function '${functionName}':`, error);
  // Create a more user-friendly error message.
  const message = error.message || 'An error occurred while communicating with the AI service.';
  throw new Error(message);
};

export const getHexCodeForColorName = async (colorName: string): Promise<string> => {
    if (!colorName) return '#000000';
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following color name and return ONLY a JSON object with a single key "hexCode" with its most likely hex color code. Color name: "${colorName}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hexCode: { type: Type.STRING, description: "The hex color code." }
                    },
                    required: ["hexCode"]
                }
            }
        });
        const responseText = response.text;
        const jsonResponse = JSON.parse(responseText.trim());
        if (jsonResponse.hexCode && /^#[0-9a-fA-F]{6}$/.test(jsonResponse.hexCode)) {
            return jsonResponse.hexCode;
        }
        return '#000000'; // Fallback for invalid format
    } catch (error) {
        handleError(error, 'getHexCodeForColorName');
        return '#000000'; // Fallback on error
    }
};

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  if (!productName) throw new Error("Product name is required.");
  try {
    const prompt = `Generate a compelling and concise e-commerce product description for a product named "${productName}". Incorporate the following keywords: "${keywords || ''}". The description should be marketing-focused, highlighting key benefits for the customer. Keep it under 100 words.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    throw handleError(error, 'generateProductDescription');
  }
};

export const identifyImage = async (base64ImageData: string): Promise<string> => {
   if (!base64ImageData) throw new Error("Image data is required.");
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
        throw handleError(error, 'identifyImage');
    }
};

export const generateProductImage = async (prompt: string): Promise<string> => {
    // This is a placeholder for a real image generation API call.
    if (!prompt) throw new Error("A prompt is required to generate an image.");
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://picsum.photos/seed/${encodedPrompt}/400/300`;
};

export const getAiAssistantResponse = async (
  prompt: string,
  history: Content[],
  storeData: { products: Product[]; orders: any[]; users: any[] },
  viewContext?: { products: Product[] }
): Promise<{ text?: string; functionCall?: any }> => {
  if (!prompt) throw new Error("A prompt is required.");
  try {
    const isFilteredView = viewContext && storeData && viewContext.products.length < storeData.products.length;

    const systemInstruction = `You are "Cartify AI Pro", a powerful e-commerce assistant for the admin of an online store called Cartify.
    Your role is to perform ANY admin task by using the tools provided. You can manage products, categories, variants, users, and storefront settings.
    - BE PROACTIVE: If a user's request is ambiguous (e.g., "delete the category"), ask for clarification ("Which category would you like to delete?").
    - USE CONTEXT: Pay attention to the conversation history and the currently viewed products data to understand the user's intent.
    - CONFIRM DESTRUCTIVE ACTIONS: Before calling a function that deletes something or bans a user, you MUST first respond with a text message asking for confirmation.
    - NATURAL INTERACTION: Interact in a conversational, professional, and helpful manner.

    You have access to the following tools:
    - Product Management: addProduct, editProduct, deleteProduct, generateProductDescription, generateImageForProduct.
    - Category Management: addCategory, editCategory, deleteCategory.
    - Variant Option Management: addVariantOption, editVariantOption, deleteVariantOption.
    - User Management: banUserByEmail, unbanUserByEmail, changeUserRoleByEmail.
    - Storefront Management: addHeroImageByUrl, removeHeroImageByUrl, updateCheckoutSettings.
    
    Current store data is provided below as JSON. Use this to answer analytical questions and to find items to modify.
    Full Store Data:
    ${JSON.stringify(storeData, null, 2)}
    
    ${isFilteredView ? `
    IMPORTANT VIEW CONTEXT: The user is currently viewing a specific, filtered list of products. Prioritize this data for questions about what's on screen.
    Currently Viewed Products:
    ${JSON.stringify(viewContext.products, null, 2)}
    ` : ''}`;
    
    const tools = [{
        functionDeclarations: [
            {
                name: 'addProduct', description: 'Adds a new product. Requires name, category, price, and stock for at least one variant.',
                parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, price: { type: Type.NUMBER }, stock: { type: Type.INTEGER }, description: { type: Type.STRING } }, required: ['name', 'category', 'price', 'stock'] },
            },
            {
                name: 'deleteProduct', description: 'Deletes a product from the store.',
                parameters: { type: Type.OBJECT, properties: { productName: { type: Type.STRING } }, required: ['productName'] },
            },
            {
                name: 'generateImageForProduct', description: 'Generates a product image based on a description.',
                parameters: { type: Type.OBJECT, properties: { productName: { type: Type.STRING }, promptDetails: { type: Type.STRING } }, required: ['productName', 'promptDetails'] },
            },
            {
                name: 'generateProductDescription', description: 'Generates a compelling e-commerce product description.',
                parameters: { type: Type.OBJECT, properties: { productName: { type: Type.STRING }, keywords: { type: Type.STRING } }, required: ['productName', 'keywords'] },
            },
            {
                name: 'deleteCategory', description: 'Deletes a category.',
                parameters: { type: Type.OBJECT, properties: { categoryName: { type: Type.STRING } }, required: ['categoryName'] },
            },
            {
                name: 'banUserByEmail', description: 'Bans a user, preventing them from logging in.',
                parameters: { type: Type.OBJECT, properties: { email: { type: Type.STRING } }, required: ['email'] },
            },
            {
                name: 'unbanUserByEmail', description: 'Unbans a user, allowing them to log in again.',
                parameters: { type: Type.OBJECT, properties: { email: { type: Type.STRING } }, required: ['email'] },
            },
            {
                name: 'addHeroImageByUrl', description: 'Adds a new image to the homepage hero section carousel.',
                parameters: { type: Type.OBJECT, properties: { imageUrl: { type: Type.STRING } }, required: ['imageUrl'] },
            },
            {
                name: 'removeHeroImageByUrl', description: 'Removes an image from the homepage hero section carousel.',
                parameters: { type: Type.OBJECT, properties: { imageUrl: { type: Type.STRING } }, required: ['imageUrl'] },
            },
            {
                name: 'updateCheckoutSettings', description: 'Updates the shipping charges and tax amount for checkout. All parameters are optional.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        shippingChargeInsideDhaka: { type: Type.NUMBER, description: 'The shipping cost for deliveries inside Dhaka.' },
                        shippingChargeOutsideDhaka: { type: Type.NUMBER, description: 'The shipping cost for deliveries outside Dhaka.' },
                        taxAmount: { type: Type.NUMBER, description: 'The fixed tax amount for all orders.' },
                    },
                },
            },
        ]
    }];

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            temperature: 0,
            systemInstruction,
            tools,
        },
        history,
    });
    
    const response = await chat.sendMessage({ message: prompt });
    
    const functionCallPart = response.candidates?.[0]?.content?.parts?.find(part => 'functionCall' in part);
    const functionCall = functionCallPart ? (functionCallPart as any).functionCall : undefined;

    if (functionCall) {
        return { functionCall };
    }

    return { text: response.text };
  } catch (error) {
    throw handleError(error, 'getAiAssistantResponse');
  }
};