import React, { useState, useRef, useEffect, useCallback } from 'react';
import { identifyImage } from '../../services/geminiService';
import { CameraIcon, XIcon } from '../shared/icons';
import BorderBeam from './BorderBeam';

interface VisionPageProps {
  onBackToShop: () => void;
}

const VisionPage: React.FC<VisionPageProps> = ({ onBackToShop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = async () => {
    stopCamera(); // Stop any existing stream
    setError('');
    setResult('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException) {
         if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             setError('Camera permission was denied. Please enable it in your browser settings to use this feature.');
         } else {
             setError('Could not access the camera. Please ensure it is not being used by another application.');
         }
      } else {
        setError('An unexpected error occurred while trying to access the camera.');
      }
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError('');
    setResult('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        
        try {
            const description = await identifyImage(base64Image);
            setResult(description);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during identification.');
        }
    }
    setIsLoading(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={onBackToShop} className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
          &larr; Back to shop
        </button>
        <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">AI Vision Assistant</h1>
            <p className="mt-2 text-muted-foreground">Point your camera at an object and let our AI identify it for you!</p>
        </div>

        <div className="relative max-w-2xl mx-auto mt-8 bg-card border border-border p-6 rounded-lg shadow-lg overflow-hidden">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${!stream ? 'hidden' : ''}`}></video>
                {!stream && (
                    <div className="text-center text-muted-foreground">
                        <CameraIcon className="w-16 h-16 mx-auto" />
                        <p className="mt-2">Camera is off</p>
                    </div>
                )}
                 {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white">
                        <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg font-semibold">Analyzing...</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-center space-x-4 mt-6">
                {!stream ? (
                    <button onClick={startCamera} className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Start Camera</button>
                ) : (
                    <>
                        <button onClick={captureAndIdentify} disabled={isLoading} className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-70">Identify Object</button>
                        <button onClick={stopCamera} className="bg-destructive text-destructive-foreground py-2 px-6 rounded-lg font-semibold hover:bg-destructive/90 transition-colors">Stop Camera</button>
                    </>
                )}
            </div>

            {error && (
                 <div className="mt-6 bg-destructive/10 text-destructive p-4 rounded-md text-sm text-center">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && !isLoading && (
                <div className="mt-6 border-t border-border pt-6">
                    <h3 className="text-xl font-semibold text-foreground mb-3">AI Analysis Result:</h3>
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-muted-foreground whitespace-pre-wrap">{result}</p>
                    </div>
                </div>
            )}
            <BorderBeam size={250} duration={7} />
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default VisionPage;