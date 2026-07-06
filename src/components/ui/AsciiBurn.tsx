import { useEffect, useMemo, useState } from "react";
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

type Cell = { char: string; color: string; key: string };

function heatAt(
  col: number,
  row: number,
  cols: number,
  rows: number,
  tick: number,
) {
  const x = col / Math.max(cols - 1, 1);
  const center = (rows - 1) / 2;
  const band = 1 - (Math.abs(row - center) / Math.max(center, 1)) * 0.38;
  const ramp = Math.pow(x, 0.62);
  const flicker =
    Math.sin(col * 0.41 + row * 0.63 + tick * 0.14) * 0.06 +
    Math.sin(col * 0.17 - tick * 0.09 + row) * 0.04;
  const tailBoost = x > 0.82 ? (x - 0.82) * 2.8 : 0;
  return Math.min(1, Math.max(0, ramp * band + flicker + tailBoost));
}

function buildGrid(cols: number, rows: number, tick: number) {
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
        color: HEAT_COLORS[index],
        key: `${row}-${col}-${index}`,
      });
    }
    grid.push(line);
  }
  return grid;
}

export function AsciiBurn({
  className,
  cols = 72,
  rows = 5,
  label,
  bare = false,
  opacity = 1,
}: {
  className?: string;
  cols?: number;
  rows?: number;
  label?: string;
  /** Full-screen subtle background mode (very faint, no chrome) */
  bare?: boolean;
  /** Overall opacity multiplier (use low values like 0.05-0.12 for background) */
  opacity?: number;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 90);
    return () => window.clearInterval(timer);
  }, []);

  const grid = useMemo(() => buildGrid(cols, rows, tick), [cols, rows, tick]);

  const preClass = bare
    ? "m-0 font-mono select-none overflow-hidden whitespace-pre leading-[0.9] tracking-[-0.3px]"
    : "m-0 overflow-hidden font-mono text-[9px] leading-[1.05] tracking-tight sm:text-[10px] md:text-[11px]";

  if (bare) {
    // Full background flame - extremely subtle so it never hurts readability
    return (
      <div
        className={cn("ascii-burn-bg pointer-events-none fixed inset-0 z-[-1] overflow-hidden", className)}
        style={{ opacity }}
        aria-hidden
      >
        <pre
          className={preClass}
          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", lineHeight: "0.9" }}
        >
          {grid.map((line, rowIndex) => (
            <div key={`row-${rowIndex}`} className="whitespace-pre">
              {line.map((cell) => (
                <span key={cell.key} style={{ color: cell.color, opacity: 0.75 }}>
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    );
  }

  // Original decorative bar mode
  return (
    <div
      className={cn("ascii-burn relative w-full select-none", className)}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <div className="relative overflow-hidden rounded-sm bg-stone-950 px-0.5 py-1 dark:bg-black">
        <pre
          className={preClass}
          style={{ fontFamily: "var(--font-mono)" }}
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

        <span
          className="pointer-events-none absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 translate-x-[2px] rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,251,235,0.95),0_0_28px_10px_rgba(245,158,11,0.55)] sm:h-3.5 sm:w-3.5"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stone-950/80 via-transparent to-transparent" />
      </div>
    </div>
  );
}
