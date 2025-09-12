const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI, Type } = require("@google/genai");

admin.initializeApp();

// Initialize the Gemini AI client using the API key from environment variables.
// This key MUST be set in your Firebase environment using secrets.
// `firebase functions:secrets:set API_KEY`
let ai;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY environment variable not set. AI functions will fail.");
}

const checkApiKey = () => {
  if (!ai) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The Gemini API key is not configured on the server. Please contact the administrator."
    );
  }
};

// Callable function to get a hex code for a color name.
exports.getHexCode = functions.runWith({ secrets: ["API_KEY"] }).https.onCall(async (data, context) => {
  checkApiKey();
  const colorName = data.colorName;
  if (!colorName || typeof colorName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "colorName" string argument.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following color name and return its most likely hex color code. Color name: "${colorName}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hexCode: {
              type: Type.STRING,
              description: "The hex color code, starting with a '#' (e.g., '#FFFFFF')."
            }
          },
          required: ["hexCode"]
        }
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return { hexCode: jsonResponse.hexCode };
  } catch (error) {
    console.error(`Gemini API error in getHexCode for "${colorName}":`, error);
    throw new functions.https.HttpsError('internal', 'Failed to get hex code from Gemini API.');
  }
});

// Callable function to generate a product description.
exports.generateDescription = functions.runWith({ secrets: ["API_KEY"] }).https.onCall(async (data, context) => {
  checkApiKey();
  const { productName, keywords } = data;
  if (!productName || typeof productName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing "productName" string argument.');
  }

  try {
    const prompt = `Generate a compelling and concise e-commerce product description for a product named "${productName}". 
    Incorporate the following keywords: "${keywords || ''}". 
    The description should be marketing-focused, highlighting key benefits for the customer. 
    Keep it under 100 words.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error(`Gemini API error in generateDescription for "${productName}":`, error);
    throw new functions.https.HttpsError('internal', 'Failed to generate product description.');
  }
});

// Callable function to identify an image from a base64 string.
exports.identifyImage = functions.runWith({ secrets: ["API_KEY"] }).https.onCall(async (data, context) => {
    checkApiKey();
    const { base64ImageData } = data;
    if (!base64ImageData || typeof base64ImageData !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing "base64ImageData" string argument.');
    }

    try {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } };
        const textPart = { text: 'Identify the main object in this image. Provide a brief, engaging description suitable for an e-commerce platform, as if you were a helpful shopping assistant.' };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API error in identifyImage:", error);
        throw new functions.https.HttpsError('internal', 'Failed to identify the image.');
    }
});

// Callable function to generate a product image.
exports.generateImage = functions.runWith({ secrets: ["API_KEY"] }).https.onCall(async (data, context) => {
    checkApiKey();
    const { prompt } = data;
    if (!prompt || typeof prompt !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing "prompt" string argument.');
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
            return { b64Image: response.generatedImages[0].image.imageBytes };
        } else {
            throw new Error("AI did not return an image.");
        }
    } catch (error) {
        console.error(`Gemini API error in generateImage for prompt "${prompt}":`, error);
        throw new functions.https.HttpsError('internal', 'Failed to generate product image.');
    }
});

// Callable function for the AI Assistant.
exports.aiAssistant = functions.runWith({ secrets: ["API_KEY"] }).https.onCall(async (data, context) => {
    checkApiKey();
    const { prompt, history, storeData, viewContext } = data;

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

    const addProductTool = {
        name: 'addProduct', description: 'Adds a new product to the e-commerce store inventory.',
        parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, price: { type: Type.NUMBER }, stock: { type: Type.INTEGER } }, required: ['name', 'category', 'price', 'stock'] },
    };
    const generateImageForProductTool = {
        name: 'generateImageForProduct', description: 'Generates a product image based on a description.',
        parameters: { type: Type.OBJECT, properties: { productName: { type: Type.STRING }, promptDetails: { type: Type.STRING } }, required: ['productName', 'promptDetails'] },
    };
    const generateProductDescriptionTool = {
        name: 'generateProductDescription', description: 'Generates a compelling e-commerce product description.',
        parameters: { type: Type.OBJECT, properties: { productName: { type: Type.STRING }, keywords: { type: Type.STRING } }, required: ['productName', 'keywords'] },
    };

    const mappedHistory = (history || []).map(h => ({ ...h, role: h.role === 'assistant' ? 'model' : 'user' }));
    if (prompt) {
        mappedHistory.push({ role: 'user', parts: [{ text: prompt }] });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: mappedHistory,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [addProductTool, generateImageForProductTool, generateProductDescriptionTool] }],
            },
        });
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            return { functionCall: response.functionCalls[0] };
        }
    
        return response.text;
    } catch (error) {
        console.error("Gemini API error in aiAssistant:", error);
        throw new functions.https.HttpsError('internal', 'Failed to get a response from the AI assistant.');
    }
});
