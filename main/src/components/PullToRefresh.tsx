import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void> | void;
    threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    threshold = 100 // Reverted to original threshold for easier activation
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const spinnerControls = useAnimation();

    // Refs for touch tracking
    const startY = useRef(0);
    const isDragging = useRef(false);

    // Reset when component mounts or updates
    useEffect(() => {
        spinnerControls.set({ y: 0, opacity: 0, rotate: 0 });
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isRefreshing) return;

        // Only trigger if we are at the very top of the scroll container
        const scrollTop = containerRef.current?.scrollTop ?? 0;

        // Ensure we are really at the top (allow 1px slack)
        if (scrollTop <= 1) {
            startY.current = e.touches[0].clientY;
            isDragging.current = true;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || isRefreshing) return;

        const currentTouchY = e.touches[0].clientY;
        const delta = currentTouchY - startY.current;
        const scrollTop = containerRef.current?.scrollTop ?? 0;

        // If user pulls down while at top
        if (scrollTop <= 1 && delta > 0) {
            // Apply standard resistance/damping
            const damped = Math.min(delta * 0.5, threshold * 2);

            setPullDistance(damped);

            // Visual deadzone & Slide-in effect
            // We start at y: -50. So at damped = 0, y = -50.
            // We want it to be fully visible at threshold.

            const startOffset = -50;
            const targetY = startOffset + damped;

            if (damped < 20) {
                // Keep hidden
                spinnerControls.set({ y: startOffset, opacity: 0 });
            } else {
                spinnerControls.set({
                    y: targetY,
                    opacity: Math.min((damped - 20) / (threshold * 0.3), 1),
                    rotate: (damped / threshold) * 360
                });
            }
        } else {
            // If scrolling back up/down, cancel pull
            if (isDragging.current) {
                isDragging.current = false;
                setPullDistance(0);
                spinnerControls.start({ y: -50, opacity: 0 });
            }
        }
    };

    const handleTouchEnd = async () => {
        isDragging.current = false;
        if (isRefreshing) return;

        if (pullDistance > threshold) {
            setIsRefreshing(true);

            // Snap to loading position (approx y=50 or threshold/2)
            await spinnerControls.start({
                y: threshold / 2, // Centered nicely
                opacity: 1,
                rotate: 0,
                transition: { type: "spring", stiffness: 300, damping: 30 }
            });

            // Start spinning
            spinnerControls.start({
                rotate: 360,
                transition: { repeat: Infinity, duration: 1, ease: "linear" }
            });

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                spinnerControls.stop();
                spinnerControls.start({
                    y: -50,
                    opacity: 0,
                    transition: { duration: 0.2 }
                });
            }
        } else {
            // Snap back
            setPullDistance(0);
            spinnerControls.start({
                y: -50,
                opacity: 0,
                transition: { type: "spring", stiffness: 300, damping: 30 }
            });
        }
    };

    return (
        <div className="relative h-full overflow-hidden flex flex-col">
            {/* 
              Floating Spinner
            */}
            <div className="absolute top-0 left-0 right-0 flex justify-center mt-2 pointer-events-none z-[10000]">
                <motion.div
                    animate={spinnerControls}
                    initial={{ y: -50, opacity: 0 }}
                    className="bg-white p-2 rounded-full border border-green-100 text-green-600 flex items-center justify-center shadow-md"
                    style={{ willChange: 'transform, opacity' }}
                >
                    <RefreshCw size={20} />
                </motion.div>
            </div>

            {/* Content Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    touchAction: 'pan-y',
                    overscrollBehaviorY: 'contain' // Prevents browser pull-to-refresh
                }}
            >
                {children}
            </div>
        </div>
    );
};
