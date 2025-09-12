import React, { useState, useEffect, useRef } from 'react';
import { BotIcon, UserIcon } from '../shared/icons';
import { getAiAssistantResponse, generateProductImage, generateProductDescription } from '../../services/geminiService';
import { onProductsValueChange, fetchAllOrders, onAllUsersAndRolesValueChange, saveProduct } from '../../services/databaseService';
import type { Product, Order, UserRoleInfo } from '../../types';

interface Message {
    role: 'user' | 'assistant';
    text?: string;
    imageUrl?: string;
    isApprovalRequest?: boolean;
    productName?: string;
}

interface AiAssistantPageProps {
    viewContext: {
        products: Product[];
    };
    openProductModal: (mode: 'add', product: null, prefillData: Partial<Product>) => void;
}

const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ viewContext, openProductModal }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [handledApprovals, setHandledApprovals] = useState<number[]>([]);
    const storeData = useRef<{products: Product[], orders: (Order & {userId: string})[], users: UserRoleInfo[]}>({ products: [], orders: [], users: [] });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const [products, orders, users] = await Promise.all([
                    new Promise<Product[]>(resolve => onProductsValueChange(resolve)),
                    fetchAllOrders(),
                    new Promise<UserRoleInfo[]>(resolve => onAllUsersAndRolesValueChange(resolve))
                ]);
                storeData.current = { products, orders, users };
                setIsDataLoaded(true);
                setMessages([{
                    role: 'assistant',
                    text: "Hello! I'm your Cartify AI Assistant. I've loaded the latest store data. How can I help you manage your store today?"
                }]);
            } catch (error) {
                console.error("Failed to load store data for AI assistant:", error);
                setMessages([{
                    role: 'assistant',
                    text: "Hello! I'm your Cartify AI Assistant. I'm having trouble loading your store data right now, but you can still ask me general questions."
                }]);
            }
        };
        fetchStoreData();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent, prompt?: string) => {
        e.preventDefault();
        const query = prompt || userInput;
        if (!query.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', text: query }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const historyForApi = newMessages.slice(1).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            
            const response = await getAiAssistantResponse(query, historyForApi.slice(0, -1), storeData.current, viewContext);
            
            if (typeof response === 'object' && response.functionCall) {
                const { name, args } = response.functionCall;
                
                if (name === 'generateImageForProduct') {
                    setIsLoading(true); // Keep loading state for image generation
                    setMessages(prev => [...prev, { role: 'assistant', text: `Got it. Generating an image for "${args.promptDetails || args.productName}"...` }]);
                    try {
                        const b64Image = await generateProductImage(args.promptDetails || args.productName);
                        const imageUrl = `data:image/png;base64,${b64Image}`;
                        setMessages(prev => [
                            ...prev,
                            { 
                                role: 'assistant', 
                                text: "Here is the image I generated. Would you like to use this to create a new product?",
                                imageUrl: imageUrl,
                                isApprovalRequest: true,
                                productName: args.productName,
                            }
                        ]);
                    } catch (imgError) {
                        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I ran into an error while generating the image. Please try again." }]);
                    } finally {
                       setIsLoading(false);
                    }
                } else if (name === 'addProduct') {
                    // This remains for adding products without an image
                    try {
                        // FIX: Object literal may only specify known properties. Product requires a `variants` array instead of price/stock.
                        const newProductData: Omit<Product, 'id'> = {
                            name: args.name, category: args.category,
                            variants: [{ id: `v_${Date.now()}`, name: 'Standard', price: args.price, stock: args.stock }],
                            description: 'Product added by AI. Please review and update the description.',
                            imageUrls: [`https://picsum.photos/seed/${encodeURIComponent(args.name)}/400/300`],
                            rating: 0, reviews: 0,
                        };
                        await saveProduct(newProductData);
                        setMessages(prev => [...prev, { role: 'assistant', text: `Alright, I've added the product "${args.name}" to the store.` }]);
                    } catch (dbError) {
                         setMessages(prev => [...prev, { role: 'assistant', text: `I failed to add the product. Error: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}` }]);
                    }
                } else if (name === 'generateProductDescription') {
                    setIsLoading(true);
                    setMessages(prev => [...prev, { role: 'assistant', text: `Of course. Generating a description for "${args.productName}"...` }]);
                    try {
                        const description = await generateProductDescription(args.productName, args.keywords);
                        const fullMessage = `Here is the description I generated for "${args.productName}":\n\n${description}`;
                        setMessages(prev => [...prev, { role: 'assistant', text: fullMessage }]);
                    } catch (descError) {
                        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't generate the description right now. Please try again." }]);
                    } finally {
                        setIsLoading(false);
                    }
                }
            } else if (typeof response === 'string') {
                setMessages(prev => [...prev, { role: 'assistant', text: response }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageApproval = (productName: string, imageUrl: string, messageIndex: number) => {
        openProductModal('add', null, { name: productName, imageUrls: [imageUrl] });
        setHandledApprovals(prev => [...prev, messageIndex]);
        setMessages(prev => [...prev, { role: 'user', text: "Yes, let's use this image." }]);
    };

    const handleImageRejection = (messageIndex: number) => {
        setMessages(prev => [...prev, { role: 'user', text: "No, that's not quite right. Let's cancel for now." }]);
        setHandledApprovals(prev => [...prev, messageIndex]);
    };


    const PromptSuggestion: React.FC<{ text: string }> = ({ text }) => (
        <button
            onClick={(e) => handleSendMessage(e, text)}
            className="bg-accent text-left text-sm text-accent-foreground p-3 rounded-lg hover:bg-muted/80 transition-colors"
        >
            {text}
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-foreground mb-4 flex-shrink-0">AI Assistant</h1>
            <div className="bg-card rounded-lg shadow-sm border border-border flex-grow flex flex-col overflow-hidden">
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 message-animate-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center"><BotIcon className="h-5 w-5 text-muted-foreground" /></div>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'assistant' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>
                                {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                                {msg.isApprovalRequest && msg.imageUrl && (
                                    <div className="mt-2 p-2 bg-background rounded-lg">
                                        <img src={msg.imageUrl} alt={msg.productName} className="rounded-md max-w-xs mx-auto" />
                                        {!handledApprovals.includes(index) && (
                                            <div className="flex justify-center space-x-2 mt-2">
                                                <button onClick={() => handleImageApproval(msg.productName!, msg.imageUrl!, index)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md font-semibold hover:bg-green-700 transition-colors">Use Image & Add Details</button>
                                                <button onClick={() => handleImageRejection(index)} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-accent transition-colors">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center"><UserIcon className="h-5 w-5 text-muted-foreground" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center"><BotIcon className="h-5 w-5 text-muted-foreground" /></div>
                            <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {messages.length <= 1 && isDataLoaded && (
                        <div className="border-t border-border pt-4">
                            <p className="text-sm text-muted-foreground mb-3 text-center">Here are some things you can ask:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <PromptSuggestion text="What is the total inventory value of the currently displayed items?" />
                                <PromptSuggestion text="Create an image for a 'vintage leather backpack'." />
                                <PromptSuggestion text="Write a description for 'Smart Fitness Watch' with keywords: sleek, heart rate monitor, long battery." />
                                <PromptSuggestion text="Add a new product called 'Premium Leather Wallet' to the 'Fashion' category, price 3500, stock 150." />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-border flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={isDataLoaded ? "Ask about your store or ask me to create a product image..." : "Loading store data..."}
                            disabled={isLoading || !isDataLoaded}
                            className="flex-grow p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;
