import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, BrainCircuit, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { useNotification } from '../../hooks/useNotification.jsx';
import { getSalesSummary } from '../../api/EcommerceApi.js';
import { generateSalesAnalysis } from '../../api/GeminiApi.js';

const AiSalesAnalyst = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { addNotification } = useNotification();

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReport(null);
        try {
            // 1. Fetch aggregated sales data from the backend
            const salesData = await getSalesSummary();
            if (!salesData || salesData.number_of_orders === 0) {
                 addNotification({ type: 'info', title: 'Not Enough Data', message: 'No sales data found in the last 7 days to generate a report.' });
                 setError('No sales data in the last 7 days.');
                 return;
            }

            // 2. Send data to Gemini API for analysis
            const analysisResult = await generateSalesAnalysis(salesData);
            setReport(analysisResult);
            addNotification({ type: 'success', title: 'AI Report Generated!', message: 'Your weekly sales analysis is ready.' });

        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
            addNotification({ type: 'error', title: 'Analysis Failed', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-effect rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-purple-300" />
                        AI Sales Analyst
                    </h2>
                    <p className="text-white/70 text-sm">Get AI-powered insights on your weekly sales performance.</p>
                </div>
                {report && (
                    <Button variant="ghost" size="icon" onClick={handleGenerateReport} disabled={loading} aria-label="Generate new report">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>
            
            <div className="min-h-[200px] flex flex-col justify-center">
                {loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3 text-white/80">
                        <Loader2 className="h-10 w-10 mx-auto animate-spin text-purple-300" />
                        <p className="font-semibold">Analyzing Sales Data...</p>
                        <p className="text-xs">Our AI is crunching the numbers. This might take a moment.</p>
                    </motion.div>
                ) : error ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3 text-yellow-300">
                        <AlertTriangle className="h-10 w-10 mx-auto" />
                        <p className="font-semibold">Could not generate report</p>
                        <p className="text-xs max-w-sm mx-auto">{error}</p>
                         <Button onClick={handleGenerateReport}>Try Again</Button>
                    </motion.div>
                ) : report ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <h3 className="text-xl font-semibold text-purple-300">{report.title}</h3>
                        <p className="text-white/90">{report.summary}</p>
                        <div>
                            <h4 className="font-semibold text-white mb-2">Key Insights:</h4>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                {report.keyInsights.map((insight, index) => (
                                    <li key={index}>{insight}</li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                         <BrainCircuit className="h-12 w-12 mx-auto text-white/50" />
                        <p className="text-white/80">Click the button to generate your weekly sales report.</p>
                        <Button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Weekly Report
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AiSalesAnalyst;
