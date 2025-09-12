const functions = require("firebase-functions");
const { GoogleGenAI, Type } = require("@google/genai");

// Get Gemini API Key from Firebase Functions configuration
const API_KEY = functions.config().gemini?.key;

if (!API_KEY) {
  console.error("Gemini API Key not set in Firebase Functions config. Run: firebase functions:config:set gemini.key='YOUR_API_KEY'");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper function to handle errors and throw a structured HTTPS error
const handleError = (error, context) => {
  console.error("AI Function Error:", error.message, {
    // Adding context for better debugging
    auth: context.auth ? { uid: context.auth.uid } : "No auth",
  });
  throw new functions.https.HttpsError("internal", "An error occurred while communicating with the AI service.", error.message);
};

// --- Callable Functions ---

/**
 * A modular function to handle Gemini API calls.
 * This can be adapted in the future to call other models (e.g., OpenAI).
 */
const callGeminiModel = async (options) => {
    return await ai.models.generateContent(options);
};

exports.getHexCodeForColorName = functions.https.onCall(async (data, context) => {
  const colorName = data.colorName;
  if (!colorName) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with one argument 'colorName'.");
  }

  try {
    const response = await callGeminiModel({
      model: "gemini-2.5-flash",
      contents: `Analyze the following color name and return its most likely hex color code. Color name: "${colorName}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { hexCode: { type: Type.STRING, description: "The hex color code, starting with '#'." } },
          required: ["hexCode"],
        },
      },
    });
    const jsonResponse = JSON.parse(response.text);
    return { hexCode: jsonResponse.hexCode };
  } catch (error) {
    handleError(error, context);
  }
});

exports.generateProductDescription = functions.https.onCall(async (data, context) => {
    const { productName, keywords } = data;
    if (!productName) {
        throw new functions.https.HttpsError("invalid-argument", "Missing 'productName' argument.");
    }
    try {
        const prompt = `Generate a compelling and concise e-commerce product description for a product named "${productName}". Incorporate the following keywords: "${keywords || ''}". The description should be marketing-focused, highlighting key benefits for the customer. Keep it under 100 words.`;
        const response = await callGeminiModel({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return { description: response.text };
    } catch (error) {
        handleError(error, context);
    }
});

exports.identifyImage = functions.https.onCall(async (data, context) => {
    const { base64ImageData } = data;
    if (!base64ImageData) {
        throw new functions.https.HttpsError("invalid-argument", "Missing 'base64ImageData' argument.");
    }
    try {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } };
        const textPart = { text: 'Identify the main object in this image. Provide a brief, engaging description suitable for an e-commerce platform, as if you were a helpful shopping assistant.' };
        const response = await callGeminiModel({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return { description: response.text };
    } catch (error) {
        handleError(error, context);
    }
});

exports.generateProductImage = functions.https.onCall(async (data, context) => {
    const { prompt } = data;
    if (!prompt) {
        throw new functions.https.HttpsError("invalid-argument", "Missing 'prompt' argument.");
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
            return { base64Image: response.generatedImages[0].image.imageBytes };
        }
        throw new Error("AI did not return an image.");
    } catch (error) {
        handleError(error, context);
    }
});

exports.getAiAssistantResponse = functions.https.onCall(async (data, context) => {
  const { prompt, history, storeData, viewContext } = data;
  
  if (!prompt) {
    throw new functions.https.HttpsError("invalid-argument", "Missing 'prompt' argument.");
  }

  try {
    const isFilteredView = viewContext && storeData && viewContext.products.length < storeData.products.length;

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
    
    const response = await callGeminiModel({
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

    return { text: response.text };
  } catch (error) {
    handleError(error, context);
  }
});
