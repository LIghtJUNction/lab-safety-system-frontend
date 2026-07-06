import { SensorStatus } from "../../lib/types";

const strokeMap: Record<SensorStatus, string> = {
  normal: "#57534e",
  warning: "#d97706",
  danger: "#e11d48",
};

const fillMap: Record<SensorStatus, string> = {
  normal: "rgba(87, 83, 78, 0.1)",
  warning: "rgba(217, 119, 6, 0.1)",
  danger: "rgba(225, 29, 72, 0.1)",
};

export function Sparkline({
  data,
  status,
  height = 48,
}: {
  data: number[];
  status: SensorStatus;
  height?: number;
}) {
  const width = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-12"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points={area} fill={fillMap[status]} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeMap[status]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}