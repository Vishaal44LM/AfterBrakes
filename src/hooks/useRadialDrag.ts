import { useState, useRef, useCallback, useEffect } from "react";

export type RadialNodeId =
  | "pit-crew"
  | "drive-time"
  | "history"
  | "pit-lane"
  | "garage"
  | "lights-out";

interface RadialNode {
  id: RadialNodeId;
  angle: number; // degrees from 12 o'clock, clockwise
}

/** All 6 nodes at 60° intervals starting from 12 o'clock */
const NODES: RadialNode[] = [
  { id: "pit-crew", angle: 0 },
  { id: "drive-time", angle: 60 },
  { id: "history", angle: 120 },
  { id: "pit-lane", angle: 180 },
  { id: "garage", angle: 240 },
  { id: "lights-out", angle: 300 },
];

/** Convert drag vector (dx, dy) to clock angle (0° = up/12 o'clock, clockwise) */
function vectorToClockAngle(dx: number, dy: number): number {
  // atan2(dx, -dy) gives angle from 12 o'clock direction, clockwise positive
  return (Math.atan2(dx, -dy) * (180 / Math.PI) + 360) % 360;
}

/** Shortest angular distance between two angles */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Find the node closest to a given clock angle */
function findNearestNode(angle: number): RadialNode {
  let nearest = NODES[0];
  let minDist = angularDistance(angle, NODES[0].angle);
  for (let i = 1; i < NODES.length; i++) {
    const dist = angularDistance(angle, NODES[i].angle);
    if (dist < minDist) {
      minDist = dist;
      nearest = NODES[i];
    }
  }
  return nearest;
}

/** Convert a clock angle + distance to screen offset (x, y) */
function angleToOffset(angleDeg: number, distance: number): { x: number; y: number } {
  const rad = angleDeg * (Math.PI / 180);
  return {
    x: Math.sin(rad) * distance,
    y: -Math.cos(rad) * distance,
  };
}

export interface RadialDragState {
  isDragging: boolean;
  offset: { x: number; y: number };
  activeNodeId: RadialNodeId | null;
  dragProgress: number; // 0 to 1
}

interface UseRadialDragOptions {
  threshold?: number; // distance to trigger navigation
  maxDrag?: number; // max visual drag distance
  deadzone?: number; // min distance before direction detection
  onNavigate?: (nodeId: RadialNodeId) => void;
}

export const useRadialDrag = ({
  threshold = 70,
  maxDrag = 100,
  deadzone = 15,
  onNavigate,
}: UseRadialDragOptions = {}) => {
  const [state, setState] = useState<RadialDragState>({
    isDragging: false,
    offset: { x: 0, y: 0 },
    activeNodeId: null,
    dragProgress: 0,
  });

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const hasNavigated = useRef(false);
  const latestState = useRef(state);
  latestState.current = state;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY };
    hasNavigated.current = false;
    setState((s) => ({ ...s, isDragging: true, activeNodeId: null, dragProgress: 0 }));
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!startPos.current || hasNavigated.current) return;

      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Inside deadzone — no direction yet
      if (distance < deadzone) {
        setState({
          isDragging: true,
          offset: { x: dx, y: dy },
          activeNodeId: null,
          dragProgress: 0,
        });
        return;
      }

      const angle = vectorToClockAngle(dx, dy);
      const nearest = findNearestNode(angle);
      const progress = Math.min(distance / threshold, 1);

      // Magnetic snapping: blend actual offset toward target node direction
      const snapStrength = Math.min(progress * 0.7, 0.65);
      const targetOffset = angleToOffset(nearest.angle, distance);
      const blendedX = dx * (1 - snapStrength) + targetOffset.x * snapStrength;
      const blendedY = dy * (1 - snapStrength) + targetOffset.y * snapStrength;

      // Clamp to maxDrag
      const blendedDist = Math.sqrt(blendedX * blendedX + blendedY * blendedY);
      const clampedDist = Math.min(blendedDist, maxDrag);
      const scale = blendedDist > 0 ? clampedDist / blendedDist : 1;

      setState({
        isDragging: true,
        offset: { x: blendedX * scale, y: blendedY * scale },
        activeNodeId: nearest.id,
        dragProgress: progress,
      });
    },
    [threshold, maxDrag, deadzone]
  );

  const handleEnd = useCallback(() => {
    if (!startPos.current) return;

    const current = latestState.current;

    if (current.dragProgress >= 1 && current.activeNodeId) {
      hasNavigated.current = true;
      onNavigate?.(current.activeNodeId);
    }

    startPos.current = null;
    setState({
      isDragging: false,
      offset: { x: 0, y: 0 },
      activeNodeId: null,
      dragProgress: 0,
    });
  }, [onNavigate]);

  // Touch handlers
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

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  useEffect(() => {
    if (!state.isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
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

/** Utility: get (x, y) position of a node on a circle */
export function getNodePosition(angleDeg: number, radius: number) {
  return angleToOffset(angleDeg, radius);
}
