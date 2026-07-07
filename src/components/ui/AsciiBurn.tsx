import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";

const CHARS = [" ", "·", ":", "-", "=", "+", "*", "#", "%", "@"] as const;

const HEAT_COLORS = [
  "#0c0a09",
  "#1c1410",
  "#3d2518",
  "#5c3a24",
  "#8b4a2a",
  "#b45309",
  "#d97706",
  "#f59e0b",
  "#fcd34d",
  "#fffbeb",
] as const;

// For light mode: use darker chars on light bg for contrast, subtle "flame" with stone/amber tones
const LIGHT_HEAT_COLORS = [
  "#f5f5f4",
  "#e7e5e4",
  "#d6d3d1",
  "#a8a29e",
  "#78716c",
  "#57534e",
  "#44403c",
  "#292524",
  "#1c1917",
  "#0c0a09",
] as const;

type Cell = { char: string; color: string; key: string };

function heatAt(
  col: number,
  row: number,
  cols: number,
  rows: number,
  tick: number,
) {
  const x = col / Math.max(cols - 1, 1);
  const y = row / Math.max(rows - 1, 1);
  // Heat distribution for "监控热迹": vertical emphasis from bottom (like rising heat/flame),
  const vertical = Math.pow(y, 1.8); // stronger at bottom like flame base
  const horizontal = Math.sin(x * Math.PI * 1.5 + tick * 0.03) * 0.15 + 0.5; // gentle horizontal wave
  const flicker =
    Math.sin(col * 0.3 + row * 0.5 + tick * 0.2) * 0.08 +
    Math.sin(col * 0.7 - row * 0.2 + tick * 0.15) * 0.05;
  const intensity = vertical * 0.7 + horizontal * 0.2 + flicker;
  return Math.min(0.65, Math.max(0.05, intensity)); // keep subtle so it doesn't affect readability
}

function buildGrid(cols: number, rows: number, tick: number, isDark: boolean) {
  const colors = isDark ? HEAT_COLORS : LIGHT_HEAT_COLORS;
  const grid: Cell[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const line: Cell[] = [];
    for (let col = 0; col < cols; col += 1) {
      const heat = heatAt(col, row, cols, rows, tick);
      const index = Math.min(
        CHARS.length - 1,
        Math.floor(heat * (CHARS.length - 0.01)),
      );
      line.push({
        char: CHARS[index],
        color: colors[index],
        key: `${row}-${col}-${index}`,
      });
    }
    grid.push(line);
  }
  return grid;
}

export function AsciiBurn({
  className,
  cols: initialCols = 72,
  rows = 5,
  label,
  bare = false,
  opacity = 1,
  isDark = true,
}: {
  className?: string;
  cols?: number;
  rows?: number;
  label?: string;
  /** Full-screen subtle background mode (very faint, no chrome) */
  bare?: boolean;
  /** Overall opacity multiplier (use low values like 0.05-0.12 for background) */
  opacity?: number;
  isDark?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [dynamicCols, setDynamicCols] = useState(initialCols);

  // Dynamically compute cols to fill the container width, so no blank on the right
  useEffect(() => {
    const updateCols = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Approx char width for the font size used (monospace ~5-7px depending on mode)
        const charWidth = bare ? 5.5 : 6;
        const calculated = Math.max(20, Math.floor(width / charWidth));
        setDynamicCols(calculated);
      }
    };

    updateCols();
    window.addEventListener('resize', updateCols);
    // Also observe if container resizes (e.g. sidebar collapse)
    const observer = new ResizeObserver(updateCols);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateCols);
      observer.disconnect();
    };
  }, [bare]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 90);
    return () => window.clearInterval(timer);
  }, []);

  // Use dynamic cols (measured from container) to ensure the characters fill the entire width.
  // This eliminates the blank/empty area on the right side.
  const effectiveCols = dynamicCols > 0 ? dynamicCols : initialCols;
  const grid = useMemo(() => buildGrid(effectiveCols, rows, tick, isDark), [effectiveCols, rows, tick, isDark]);

  const preClass = bare
    ? "m-0 font-mono select-none overflow-hidden whitespace-pre leading-[0.82] tracking-[-0.8px] h-full w-full"
    : "m-0 overflow-hidden font-mono text-[9px] leading-[1.05] tracking-tight sm:text-[10px] md:text-[11px]";

  if (bare) {
    // Full background flame - subtle ambient embers across entire screen.
    // Visual meaning: decorative safety posture heat pattern, not sensor or event data.
    // Subtle (low opacity), dynamic width fill (no blank right), does not affect readability.
    return (
      <div
        ref={containerRef}
        className={cn("ascii-burn-bg pointer-events-none fixed inset-0 z-[-1] overflow-hidden", className)}
        style={{ opacity }}
        aria-hidden
      >
        <pre
          className={preClass}
          style={{ 
            fontFamily: "var(--font-mono)", 
            fontSize: "6.5px", 
            lineHeight: "0.82",
            letterSpacing: "-0.8px",
            height: "100%",
            width: "100%"
          }}
        >
          {grid.map((line, rowIndex) => (
            <div key={`row-${rowIndex}`} className="whitespace-pre">
              {line.map((cell) => (
                <span key={cell.key} style={{ color: cell.color }}>
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    );
  }

  // Original decorative bar mode (now fills full width dynamically via dynamicCols, no blank right).
  // Flickering/burning characters represent live data flow and the "temperature" of ongoing safety monitoring.
  // Now full-width, no empty right side or artificial glow dot.
  return (
    <div
      ref={containerRef}
      className={cn("ascii-burn relative w-full select-none", className)}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <div className={cn(
        "relative overflow-hidden rounded-sm px-0.5 py-1",
        isDark ? "bg-stone-950" : "bg-stone-100"
      )}>
        <pre
          className={preClass}
          style={{ fontFamily: "var(--font-mono)", width: '100%' }}
        >
          {grid.map((line, rowIndex) => (
            <div key={`row-${rowIndex}`} className="whitespace-pre">
              {line.map((cell) => (
                <span key={cell.key} style={{ color: cell.color }}>
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
