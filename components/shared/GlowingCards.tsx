"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export interface GlowingCardsProps {
  children: React.ReactNode;
  className?: string;
  enableGlow?: boolean;
  glowRadius?: number;
  glowOpacity?: number;
  animationDuration?: number;
  gap?: string;
  padding?: string;
  responsive?: boolean;
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className,
  glowColor = "#3b82f6",
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-full cursor-pointer rounded-2xl text-black dark:text-white",
        "bg-card border border-border",
        "transition-all duration-400 ease-out h-full",
        className
      )}
      style={{
        '--glow-color': glowColor,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlowingCards: React.FC<GlowingCardsProps> = ({
  children,
  className,
  enableGlow = true,
  glowRadius = 25,
  glowOpacity = 0.8,
  animationDuration = 400,
  gap = "1rem",
  padding = "1rem",
  responsive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;

    if (!container || !overlay || !enableGlow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setShowOverlay(true);

      overlay.style.setProperty('--x', x + 'px');
      overlay.style.setProperty('--y', y + 'px');
      overlay.style.setProperty('--opacity', glowOpacity.toString());
    };

    const handleMouseLeave = () => {
      setShowOverlay(false);
      overlay.style.setProperty('--opacity', '0');
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableGlow, glowOpacity]);

  const containerStyle = {
    '--gap': gap,
    '--padding': padding,
    '--animation-duration': animationDuration + 'ms',
    '--glow-radius': glowRadius + 'rem',
    '--glow-opacity': glowOpacity,
  } as React.CSSProperties;

  return (
    <div className={cn("relative w-full", className)} style={containerStyle}>
      <div
        ref={containerRef}
        className="relative"
        style={{ padding: "var(--padding)" }}
      >
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap)]",
             responsive && "flex-row" // This class is now irrelevant
          )}
        >
          {children}
        </div>

        {enableGlow && (
          <div
            ref={overlayRef}
            className={cn(
              "absolute inset-0 pointer-events-none select-none",
              "opacity-0 transition-all duration-[var(--animation-duration)] ease-out"
            )}
            style={{
              WebkitMask: "radial-gradient(var(--glow-radius) var(--glow-radius) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)",
              mask: "radial-gradient(var(--glow-radius) var(--glow-radius) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)",
              opacity: showOverlay ? 'var(--opacity)' : '0',
            }}
          >
            <div
              className={cn(
                 "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap)]",
                 responsive && "flex-row" // This class is now irrelevant
              )}
              style={{ padding: "var(--padding)" }}
            >
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === GlowingCard) {
                  // FIX: In some strict TypeScript configurations, props of a React child element can be typed as 'unknown'.
                  // We cast `child.props` to `any` to safely access the `glowColor`, `className`, and `style` properties,
                  // which we know exist on `GlowingCard` components.
                  const props = child.props as any;
                  const cardGlowColor = props.glowColor || "#3b82f6";
                  return React.cloneElement(child as React.ReactElement<any>, {
                    className: cn(
                      props.className,
                      "bg-opacity-15 dark:bg-opacity-15",
                      "border-opacity-100 dark:border-opacity-100"
                    ),
                    style: {
                      ...props.style,
                      backgroundColor: cardGlowColor + "1A", // 10% opacity
                      borderColor: cardGlowColor,
                      boxShadow: "0 0 0 1px inset " + cardGlowColor,
                    },
                  });
                }
                return child;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { GlowingCards as default };