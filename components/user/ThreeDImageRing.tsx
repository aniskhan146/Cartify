"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, easeOut } from "framer-motion";
import { cn } from "../../lib/utils";
import { animate } from "framer-motion";

export interface ThreeDImageRingProps {
  /** Array of image URLs to display in the ring */
  images: string[];
  /** Container width in pixels (will be scaled) */
  width?: number;
  /** 3D perspective value */
  perspective?: number;
  /** Distance of images from center (z-depth) */
  imageDistance?: number;
  /** Initial rotation of the ring */
  initialRotation?: number;
  /** Animation duration for entrance */
  animationDuration?: number;
  /** Stagger delay between images */
  staggerDelay?: number;
  /** Hover opacity for non-hovered images */
  hoverOpacity?: number;
  /** Custom container className */
  containerClassName?: string;
  /** Custom ring className */
  ringClassName?: string;
  /** Custom image className */
  imageClassName?: string;
  /** Background color of the stage */
  backgroundColor?: string;
  /** Enable/disable drag functionality */
  draggable?: boolean;
  /** Animation ease for entrance */
  ease?: string;
  /** Breakpoint for mobile responsiveness (e.g., 768 for iPad mini) */
  mobileBreakpoint?: number;
  /** Scale factor for mobile (e.g., 0.7 for 70% size) */
  mobileScaleFactor?: number;
  /** Power for the drag end inertia animation (higher means faster stop) */
  inertiaPower?: number;
  /** Time constant for the drag end inertia animation (duration of deceleration in ms) */
  inertiaTimeConstant?: number;
  /** Multiplier for initial velocity when drag ends (influences initial "spin") */
  inertiaVelocityMultiplier?: number;
  /** Enable/disable automatic rotation */
  autoRotate?: boolean;
  /** Duration in seconds for one full 360-degree rotation */
  rotationDuration?: number;
}

export function ThreeDImageRing({
  images,
  width = 300,
  perspective = 2000,
  imageDistance = 500,
  initialRotation = 180,
  animationDuration = 1.5,
  staggerDelay = 0.1,
  hoverOpacity = 0.5,
  containerClassName,
  ringClassName,
  imageClassName,
  backgroundColor,
  draggable = true,
  ease = "easeOut",
  mobileBreakpoint = 768,
  mobileScaleFactor = 0.8,
  inertiaPower = 0.8, // Default power for inertia
  inertiaTimeConstant = 300, // Default time constant for inertia
  inertiaVelocityMultiplier = 20, // Default multiplier for initial spin
  autoRotate = true,
  rotationDuration = 40,
}: ThreeDImageRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const rotationY = useMotionValue(initialRotation);
  const startX = useRef<number>(0);
  const currentRotationY = useRef<number>(initialRotation);
  const isDragging = useRef<boolean>(false);
  const velocity = useRef<number>(0); // To track drag velocity
  const animationControls = useRef<any>(null);

  const [currentScale, setCurrentScale] = useState(1);

  const angle = useMemo(() => (images.length > 0 ? 360 / images.length : 0), [
    images.length,
  ]);
  
  const startAnimation = () => {
    if (animationControls.current) {
      animationControls.current.stop();
    }
    animationControls.current = animate(rotationY, rotationY.get() + 360, {
      duration: rotationDuration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
  };

  useEffect(() => {
    const unsubscribe = rotationY.on("change", (latestRotation) => {
      currentRotationY.current = latestRotation;
    });
    return () => unsubscribe();
  }, [rotationY]);

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const newScale =
        viewportWidth <= mobileBreakpoint ? mobileScaleFactor : 1;
      setCurrentScale(newScale);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint, mobileScaleFactor]);

  useEffect(() => {
    if (autoRotate && images.length > 0) {
      startAnimation();
    } else {
      animationControls.current?.stop();
    }
    return () => {
      animationControls.current?.stop();
    };
  }, [autoRotate, images.length, rotationDuration]);

  const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
    if (!draggable) return;
    animationControls.current?.stop();
    isDragging.current = true;
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    startX.current = clientX;
    velocity.current = 0; // Reset velocity
    if (ringRef.current) {
      (ringRef.current as HTMLElement).style.cursor = "grabbing";
    }
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDrag);
    document.addEventListener("touchend", handleDragEnd);
  };

  const handleDrag = (event: MouseEvent | TouchEvent) => {
    if (!draggable || !isDragging.current) return;

    const clientX =
      "touches" in event
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
    const deltaX = clientX - startX.current;

    velocity.current = -deltaX * 0.5;
    rotationY.set(currentRotationY.current + velocity.current);
    startX.current = clientX;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    if (ringRef.current) {
      ringRef.current.style.cursor = "grab";
      currentRotationY.current = rotationY.get();
    }

    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDrag);
    document.removeEventListener("touchend", handleDragEnd);

    const initial = rotationY.get();
    const velocityBoost = velocity.current * inertiaVelocityMultiplier;
    const target = initial + velocityBoost;
    
    if (angle > 0) {
        animate(initial, target, {
            type: "inertia",
            velocity: velocityBoost,
            power: inertiaPower,
            timeConstant: inertiaTimeConstant,
            restDelta: 0.5,
            modifyTarget: (target) => Math.round(target / angle) * angle,
            onUpdate: (latest) => {
                rotationY.set(latest);
            },
            onComplete: () => {
                if (autoRotate) {
                    startAnimation();
                }
            }
        });
    }

    velocity.current = 0;
  };
  
  const handleMouseEnter = () => {
    if (autoRotate && !isDragging.current) {
      animationControls.current?.stop();
    }
  };

  const handleMouseLeave = () => {
    if (autoRotate && !isDragging.current) {
      startAnimation();
    }
  };

  const imageVariants = {
    hidden: { y: 200, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden select-none relative",
        containerClassName
      )}
      style={{
        backgroundColor,
        transform: `scale(${currentScale})`,
        transformOrigin: "center center",
      }}
      onMouseDown={draggable ? handleDragStart : undefined}
      onTouchStart={draggable ? handleDragStart : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          perspective: `${perspective}px`,
          width: `${width}px`,
          height: `${width * (2 / 3)}px`,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          ref={ringRef}
          className={cn("w-full h-full absolute", ringClassName)}
          style={{
            transformStyle: "preserve-3d",
            rotateY: rotationY,
            cursor: draggable ? "grab" : "default",
          }}
        >
          {images.map((imageUrl, index) => (
            <motion.div
              key={index}
              className={cn("w-full h-full absolute", imageClassName)}
              style={{
                transformStyle: "preserve-3d",
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backfaceVisibility: "hidden",
                rotateY: index * -angle,
                z: -imageDistance * currentScale,
                transformOrigin: `50% 50% ${
                  imageDistance * currentScale
                }px`,
                backgroundPosition: "center",
              }}
              initial="hidden"
              animate="visible"
              variants={imageVariants}
              custom={index}
              transition={{
                delay: index * staggerDelay,
                duration: animationDuration,
                ease: easeOut,
              }}
              whileHover={{ opacity: 1, transition: { duration: 0.15 } }}
              onHoverStart={() => {
                if (isDragging.current) return;
                if (ringRef.current) {
                  Array.from(ringRef.current.children).forEach(
                    (imgEl, i) => {
                      if (i !== index) {
                        (
                          imgEl as HTMLElement
                        ).style.opacity = `${hoverOpacity}`;
                      }
                    }
                  );
                }
              }}
              onHoverEnd={() => {
                if (isDragging.current) return;
                if (ringRef.current) {
                  Array.from(ringRef.current.children).forEach((imgEl) => {
                    (imgEl as HTMLElement).style.opacity = `1`;
                  });
                }
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default ThreeDImageRing;