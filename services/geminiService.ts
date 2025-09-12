import type { Product } from '../types';
import { functions } from './firebase';

// Helper to create callable functions
const createCallable = <T, R>(name: string) => functions.httpsCallable(name) as (data: T) => Promise<{ data: R }>;

// Create callable functions for each backend endpoint
const getHexCodeCallable = createCallable<{ colorName: string }, { hexCode: string }>('getHexCode');
const generateDescriptionCallable = createCallable<{ productName: string; keywords: string }, string>('generateDescription');
const identifyImageCallable = createCallable<{ base64ImageData: string }, string>('identifyImage');
const generateImageCallable = createCallable<{ prompt: string }, { b64Image: string }>('generateImage');
const aiAssistantCallable = createCallable<any, string | { functionCall: any }>('aiAssistant');


export const getHexCodeForColorName = async (colorName: string): Promise<string> => {
    try {
        const result = await getHexCodeCallable({ colorName });
        const hexCode = result.data.hexCode;
        if (hexCode && /^#[0-9a-fA-F]{6}$/.test(hexCode)) {
             return hexCode;
        }
        console.warn("Invalid hex code format received from function:", hexCode);
        return '#000000'; // Fallback
    } catch (error) {
        console.error(`Error calling getHexCode function for "${colorName}":`, error);
        // Fallback to a default color on error to avoid breaking the UI
        return '#000000';
    }
};

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  try {
    const result = await generateDescriptionCallable({ productName, keywords });
    return result.data;
  } catch (error) {
    console.error("Error calling generateDescription function:", error);
    throw new Error("Failed to generate description from AI. Please try again.");
  }
};

export const identifyImage = async (base64ImageData: string): Promise<string> => {
   try {
        const result = await identifyImageCallable({ base64ImageData });
        return result.data;
    } catch (error) {
        console.error("Error calling identifyImage function:", error);
        throw new Error("Failed to identify the image using AI. Please try again.");
    }
};

export const generateProductImage = async (prompt: string): Promise<string> => {
    try {
        const result = await generateImageCallable({ prompt });
        if (result.data.b64Image) {
            return result.data.b64Image;
        } else {
            throw new Error("AI function did not return an image.");
        }
    } catch (error) {
        console.error("Error calling generateImage function:", error);
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
    const payload = { prompt, history, storeData, viewContext };
    const result = await aiAssistantCallable(payload);
    return result.data;
  } catch (error) {
    console.error("Error calling aiAssistant function:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};