import { useCallback, useRef } from "react";

/**
 * Custom hook for animating dots with dynamic message updates.
 * Unlike useDotAnimation, this allows updating the base message while the animation is running.
 *
 * @param intervalMs - Time between dot updates in milliseconds (default: 250ms)
 * @returns Object with startAnimation, updateMessage, and stopAnimation functions
 */
export function useDynamicDotAnimation(intervalMs: number = 250) {
  const animationIntervalRef = useRef<number | null>(null);
  const currentDotsRef = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const messageRef = useRef<string>("");

  const startAnimation = useCallback(
    (element: HTMLElement, baseMessage: string) => {
      // Store the element and message references
      elementRef.current = element;
      messageRef.current = baseMessage;

      // Clear any existing interval
      if (animationIntervalRef.current !== null) {
        clearInterval(animationIntervalRef.current);
      }

      // Reset dots to start fresh
      currentDotsRef.current = 0;

      // Update the message with animated dots
      const updateDots = () => {
        if (!elementRef.current) return;

        const visibleDots = ".".repeat(currentDotsRef.current);
        const invisibleDots = ".".repeat(3 - currentDotsRef.current);
        elementRef.current.innerHTML = `<span>${messageRef.current}${visibleDots}<span style="visibility:hidden">${invisibleDots}</span></span>`;

        // Cycle through 0, 1, 2, 3 dots
        currentDotsRef.current = (currentDotsRef.current + 1) % 4;
      };

      // Set initial state (no dots)
      updateDots();

      // Start animation
      animationIntervalRef.current = window.setInterval(
        updateDots,
        intervalMs
      );
    },
    [intervalMs]
  );

  const updateMessage = useCallback((newMessage: string) => {
    messageRef.current = newMessage;
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationIntervalRef.current !== null) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    elementRef.current = null;
    messageRef.current = "";
  }, []);

  return { startAnimation, updateMessage, stopAnimation };
}
