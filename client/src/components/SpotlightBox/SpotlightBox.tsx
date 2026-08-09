import { useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import "./SpotlightBox.css";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface SpotlightBoxProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  enabled?: boolean;
  onClick?: () => void;
}

const RIPPLE_MS = 650;

export function SpotlightBox({
  children,
  className = "",
  style,
  enabled = true,
  onClick,
}: SpotlightBoxProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height);
    const id = idRef.current++;
    setRipples(prev => [...prev, { id, x, y, size }]);
    window.setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, RIPPLE_MS);
    onClick?.();
  };

  return (
    <div
      className={`spotlight-box ${className}`}
      style={style}
      onClick={handleClick}
    >
      {children}
      {ripples.map(r => (
        <span
          key={r.id}
          className="spotlight-box__ripple"
          style={
            {
              left: `${r.x}px`,
              top: `${r.y}px`,
              width: `${r.size}px`,
              height: `${r.size}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
