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
    threshold = 100 // Slightly lower threshold for easier activation
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

        // Relaxed check: allow 1px offset
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
            // Apply resistance/damping
            // Logarithmic damping for natural feel
            const damped = Math.min(delta * 0.5, threshold * 2);

            setPullDistance(damped);

            // Direct control for responsiveness
            spinnerControls.set({
                y: damped,
                opacity: Math.min(damped / (threshold * 0.5), 1),
                rotate: (damped / threshold) * 360
            });
        } else {
            // If scrolling back up/down, cancel pull
            if (isDragging.current) {
                isDragging.current = false;
                setPullDistance(0);
                spinnerControls.start({ y: 0, opacity: 0 });
            }
        }
    };

    const handleTouchEnd = async () => {
        isDragging.current = false;
        if (isRefreshing) return;

        if (pullDistance > threshold) {
            setIsRefreshing(true);

            // Snap to loading position
            await spinnerControls.start({
                y: threshold,
                opacity: 1,
                rotate: 0, // Reset rotation for spinning animation
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
                // Determine if we should really stop refreshing here.
                // If onRefresh reloads the page, this cleanup might not even run or matter.
                // But for robust code:
                setIsRefreshing(false);
                setPullDistance(0);
                spinnerControls.stop();
                spinnerControls.start({
                    y: 0,
                    opacity: 0,
                    transition: { duration: 0.2 }
                });
            }
        } else {
            // Snap back if threshold not met
            setPullDistance(0);
            spinnerControls.start({
                y: 0,
                opacity: 0,
                transition: { type: "spring", stiffness: 300, damping: 30 }
            });
        }
    };

    return (
        <div className="relative h-full overflow-hidden flex flex-col">
            {/* 
              Floating Spinner
              - Fixed position relative to this container (absolute)
              - High z-index to overlay everything
              - Starts hidden (opacity 0)
              - pointer-events-none so it doesn't block touches 
            */}
            <div className="absolute top-0 left-0 right-0 flex justify-center -mt-2 pointer-events-none z-[10000]">
                <motion.div
                    animate={spinnerControls}
                    initial={{ y: 0, opacity: 0 }}
                    className="bg-white p-2 rounded-full border border-green-100 text-green-600 flex items-center justify-center"
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
