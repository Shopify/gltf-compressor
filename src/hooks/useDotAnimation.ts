import { useCallback, useRef } from "react";

/**
 * Custom hook for animating dots without causing re-renders.
 * Directly manipulates the DOM element's innerHTML.
 *
 * @param intervalMs - Time between dot updates in milliseconds (default: 250ms)
 * @returns Object with startAnimation and stopAnimation functions
 */
export function useDotAnimation(intervalMs: number = 250) {
  const dotAnimationIntervalRef = useRef<number | null>(null);
  const currentDotsRef = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const startAnimation = useCallback(
    (element: HTMLElement, baseMessage: string) => {
      // Store the element reference
      elementRef.current = element;

      // Clear any existing interval
      if (dotAnimationIntervalRef.current !== null) {
        clearInterval(dotAnimationIntervalRef.current);
      }

      // Reset dots to start fresh
      currentDotsRef.current = 0;

      // Update the message with animated dots
      const updateDots = () => {
        if (!elementRef.current) return;

        const visibleDots = ".".repeat(currentDotsRef.current);
        const invisibleDots = ".".repeat(3 - currentDotsRef.current);
        elementRef.current.innerHTML = `<span>${baseMessage}${visibleDots}<span style="visibility:hidden">${invisibleDots}</span></span>`;

        // Cycle through 0, 1, 2, 3 dots
        currentDotsRef.current = (currentDotsRef.current + 1) % 4;
      };

      // Set initial state (no dots)
      updateDots();

      // Start animation
      dotAnimationIntervalRef.current = window.setInterval(
        updateDots,
        intervalMs
      );
    },
    [intervalMs]
  );

  const stopAnimation = useCallback(() => {
    if (dotAnimationIntervalRef.current !== null) {
      clearInterval(dotAnimationIntervalRef.current);
      dotAnimationIntervalRef.current = null;
    }
    elementRef.current = null;
  }, []);

  return { startAnimation, stopAnimation };
}
