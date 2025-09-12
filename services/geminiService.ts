import { functions } from './firebase';
import type { Product, Order, UserRoleInfo } from '../types';

// Create callable function references
const getHexCodeFn = functions.httpsCallable('getHexCodeForColorName');
const generateDescFn = functions.httpsCallable('generateProductDescription');
const identifyImgFn = functions.httpsCallable('identifyImage');
const generateImgFn = functions.httpsCallable('generateProductImage');
const aiAssistantFn = functions.httpsCallable('getAiAssistantResponse');

export const getHexCodeForColorName = async (colorName: string): Promise<string> => {
    try {
        const result = await getHexCodeFn({ colorName });
        const data = result.data as { hexCode: string };
        if (data.hexCode && /^#[0-9a-fA-F]{6}$/.test(data.hexCode)) {
            return data.hexCode;
        }
        console.warn("Invalid hex code format received:", data.hexCode);
        return '#000000'; // Fallback
    } catch (error) {
        console.error(`Error calling getHexCodeForColorName function:`, error);
        return '#000000'; // Fallback
    }
};

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  try {
    const result = await generateDescFn({ productName, keywords });
    const data = result.data as { description: string };
    return data.description;
  } catch (error) {
    console.error("Error calling generateProductDescription function:", error);
    throw new Error("Failed to generate description from AI. Please try again.");
  }
};

export const identifyImage = async (base64ImageData: string): Promise<string> => {
   try {
        const result = await identifyImgFn({ base64ImageData });
        const data = result.data as { description: string };
        return data.description;
    } catch (error) {
        console.error("Error calling identifyImage function:", error);
        throw new Error("Failed to identify the image using AI. Please try again.");
    }
};

export const generateProductImage = async (prompt: string): Promise<string> => {
    try {
        const result = await generateImgFn({ prompt });
        const data = result.data as { base64Image: string };
        return data.base64Image;
    } catch (error) {
        console.error("Error calling generateProductImage function:", error);
        throw new Error("Failed to generate image from AI.");
    }
};

export const getAiAssistantResponse = async (
  prompt: string,
  history: any[],
  storeData: { products: Product[]; orders: any[]; users: any[] },
  viewContext?: { products: Product[] }
): Promise<string | { functionCall: any }> => {
  try {
    const result = await aiAssistantFn({ prompt, history, storeData, viewContext });
    const data = result.data as { text?: string; functionCall?: any };

    if (data.functionCall) {
        return { functionCall: data.functionCall };
    }
    return data.text || '';
  } catch (error) {
    console.error("Error getting AI assistant response:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};
