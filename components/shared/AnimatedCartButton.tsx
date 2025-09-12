import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedCartButtonProps {
    onAddToCart: (e: React.MouseEvent) => void;
    disabled?: boolean;
    className?: string;
    text?: string;
}

const AnimatedCartButton: React.FC<AnimatedCartButtonProps> = ({ 
    onAddToCart, 
    disabled, 
    className,
    text = "Add to Cart"
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    // Use useEffect to handle the timer. This is more robust against re-renders.
    useEffect(() => {
        if (isAnimating) {
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 3000); // Animation duration
            
            // Cleanup function to clear the timeout if the component unmounts
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Prevent new animation if one is already running or button is disabled
        if (disabled || isAnimating) {
            return;
        }
        // Call the parent's handler
        onAddToCart(e);
        // Start the animation
        setIsAnimating(true);
    };

    const buttonClasses = {
        'clicked bg-green-600 text-white cursor-wait': isAnimating,
        'bg-muted text-muted-foreground cursor-not-allowed': !isAnimating && disabled,
        'bg-destructive text-destructive-foreground hover:bg-destructive/90': !isAnimating && !disabled,
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                'cart-button relative px-3 w-full h-8 border-0 rounded-md outline-none cursor-pointer transition-colors duration-300 overflow-hidden font-bold active:scale-95',
                isAnimating ? 'clicked' : '',
                buttonClasses,
                className
            )}
        >
            <span
                className="add-to-cart absolute z-30 left-1/2 top-1/2 text-xs transform -translate-x-1/2 -translate-y-1/2 opacity-100">
                {text}
            </span>
            <span
                className="added absolute z-30 left-1/2 top-1/2 text-xs transform -translate-x-1/2 -translate-y-1/2 opacity-0 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                    stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Done!
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
                className="cart-shopping-svg size-8 absolute z-20 top-1/2 left-[-10%] text-2xl transform -translate-x-1/2 -translate-y-1/2">
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ fill: '#FFA704' }} viewBox="0 0 448 512"
                className="cart-box-svg size-5 absolute z-30 top-[-20%] left-[52%] text-xl transform -translate-x-1/2 -translate-y-1/2">
                <path
                    d="M50.7 58.5L0 160l208 0 0-128L93.7 32C75.5 32 58.9 42.3 50.7 58.5zM240 160l208 0L397.3 58.5C389.1 42.3 372.5 32 354.3 32L240 32l0 128zm208 32L0 192 0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-224z" />
            </svg>
        </button>
    );
};

export default AnimatedCartButton;