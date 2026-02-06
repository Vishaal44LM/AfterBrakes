import { useState, useRef, useCallback, useEffect } from "react";

export type DragDirection = "up" | "down" | "left" | "right" | null;

interface OrbDragState {
  isDragging: boolean;
  offset: { x: number; y: number };
  lockedDirection: DragDirection;
  dragProgress: number; // 0 to 1
}

interface UseOrbDragOptions {
  threshold?: number;
  maxDrag?: number;
  onNavigate?: (direction: DragDirection) => void;
}

export const useOrbDrag = ({
  threshold = 60,
  maxDrag = 120,
  onNavigate,
}: UseOrbDragOptions = {}) => {
  const [state, setState] = useState<OrbDragState>({
    isDragging: false,
    offset: { x: 0, y: 0 },
    lockedDirection: null,
    dragProgress: 0,
  });

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const hasNavigated = useRef(false);

  const getDirection = useCallback(
    (dx: number, dy: number): DragDirection => {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold * 0.4) return null;

      // Determine dominant axis
      if (absDy > absDx) {
        return dy < 0 ? "up" : "down";
      } else {
        return dx < 0 ? "left" : "right";
      }
    },
    [threshold]
  );

  const clampOffset = useCallback(
    (dx: number, dy: number, direction: DragDirection) => {
      const clamp = (v: number) =>
        Math.sign(v) * Math.min(Math.abs(v), maxDrag);

      if (direction === "up" || direction === "down") {
        return { x: dx * 0.15, y: clamp(dy) };
      }
      if (direction === "left" || direction === "right") {
        return { x: clamp(dx), y: dy * 0.15 };
      }
      return { x: clamp(dx), y: clamp(dy) };
    },
    [maxDrag]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      startPos.current = { x: clientX, y: clientY };
      hasNavigated.current = false;
      setState((s) => ({ ...s, isDragging: true, lockedDirection: null, dragProgress: 0 }));
    },
    []
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!startPos.current || hasNavigated.current) return;

      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const direction = getDirection(dx, dy);
      const offset = clampOffset(dx, dy, direction);
      const progress = Math.min(distance / threshold, 1);

      setState({
        isDragging: true,
        offset,
        lockedDirection: direction,
        dragProgress: progress,
      });
    },
    [getDirection, clampOffset, threshold]
  );

  const handleEnd = useCallback(() => {
    if (!startPos.current) return;

    const currentState = state;

    if (currentState.dragProgress >= 1 && currentState.lockedDirection) {
      hasNavigated.current = true;
      onNavigate?.(currentState.lockedDirection);
    }

    startPos.current = null;
    setState({
      isDragging: false,
      offset: { x: 0, y: 0 },
      lockedDirection: null,
      dragProgress: 0,
    });
  }, [state, onNavigate]);

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  useEffect(() => {
    if (!state.isDragging) return;

    const onMouseMoveGlobal = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUpGlobal = () => {
      handleEnd();
    };

    window.addEventListener("mousemove", onMouseMoveGlobal);
    window.addEventListener("mouseup", onMouseUpGlobal);

    return () => {
      window.removeEventListener("mousemove", onMouseMoveGlobal);
      window.removeEventListener("mouseup", onMouseUpGlobal);
    };
  }, [state.isDragging, handleMove, handleEnd]);

  return {
    ...state,
    orbHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
    },
  };
};
