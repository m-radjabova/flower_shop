import type { ReactNode } from "react";

type Point = { label: string; value: number };
type SeriesPoint = { label: string; bar: number; line: number };
type DonutSlice = { label: string; value: number; color: string };
type RadarMetric = { label: string; value: number; color?: string };

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[1.8rem] border border-[#3d171c] bg-[linear-gradient(180deg,rgba(27,8,10,0.97),rgba(14,4,6,0.98))] p-6">
      <div className="mb-5">
        <p className="font-cormorant text-4xl text-white">{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-[#caa7a0]">{subtitle}</p> : null}
      </div>
      {children}
    </article>
  );
}

function getMax(values: number[]) {
  return Math.max(...values, 1);
}

export function BarChartPanel({
  title,
  subtitle,
  data,
  color = "#ff8a9a",
}: {
  title: string;
  subtitle?: string;
  data: Point[];
  color?: string;
}) {
  const maxValue = getMax(data.map((item) => item.value));

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex h-64 items-end gap-4">
        {data.map((item) => {
          const height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 4)}%`;
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
              <span className="text-sm font-semibold text-[#f7dfd9]">{item.value}</span>
              <div className="flex h-48 w-full items-end rounded-[1.2rem] bg-[#17080a] p-2">
                <div className="w-full rounded-[0.95rem] transition-all duration-500" style={{ height, background: color }} />
              </div>
              <span className="text-center text-xs uppercase tracking-[0.16em] text-[#b7918a]">{item.label}</span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

export function LineChartPanel({
  title,
  subtitle,
  data,
  color = "#ff9fb0",
}: {
  title: string;
  subtitle?: string;
  data: Point[];
  color?: string;
}) {
  const width = 520;
  const height = 220;
  const padding = 20;
  const maxValue = getMax(data.map((item) => item.value));
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => {
    const x = padding + index * step;
    const y = height - padding - ((item.value / maxValue) * (height - padding * 2));
    return { x, y, ...item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-64 w-full">
        <defs>
          <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffd7de" stopOpacity="1" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + ((height - padding * 2) / 3) * line}
            y2={padding + ((height - padding * 2) / 3) * line}
            stroke="#3a171c"
            strokeDasharray="6 8"
          />
        ))}
        <polyline fill="none" stroke="url(#lineGlow)" strokeWidth="4" points={polyline} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill={color} />
            <text x={point.x} y={height + 22} textAnchor="middle" fill="#b7918a" fontSize="11">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}

export function AreaChartPanel({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: Point[];
}) {
  const width = 520;
  const height = 220;
  const padding = 20;
  const maxValue = getMax(data.map((item) => item.value));
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => {
    const x = padding + index * step;
    const y = height - padding - ((item.value / maxValue) * (height - padding * 2));
    return { x, y, ...item };
  });
  const areaPath = [
    `M ${padding} ${height - padding}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${width - padding} ${height - padding}`,
    "Z",
  ].join(" ");

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-64 w-full">
        <defs>
          <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff98aa" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ff98aa" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaFill)" />
        <polyline fill="none" stroke="#ff98aa" strokeWidth="3" points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#ffd7de" />
            <text x={point.x} y={height + 22} textAnchor="middle" fill="#b7918a" fontSize="11">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function DonutChartPanel({
  title,
  subtitle,
  data,
  centerLabel,
}: {
  title: string;
  subtitle?: string;
  data: DonutSlice[];
  centerLabel?: string;
}) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  let currentAngle = 0;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr] lg:items-center">
        <div className="mx-auto w-full max-w-[240px]">
          <svg viewBox="0 0 240 240" className="h-60 w-full">
            <circle cx="120" cy="120" r="70" fill="none" stroke="#20090d" strokeWidth="34" />
            {data.map((slice) => {
              const angle = (slice.value / total) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              const path = describeArc(120, 120, 70, startAngle, currentAngle);

              return (
                <path
                  key={slice.label}
                  d={path}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="34"
                  strokeLinecap="round"
                />
              );
            })}
            <text x="120" y="112" textAnchor="middle" fill="#b7918a" fontSize="12">
              Total
            </text>
            <text x="120" y="138" textAnchor="middle" fill="#fff1ed" fontSize="22" fontWeight="700">
              {centerLabel ?? total}
            </text>
          </svg>
        </div>
        <div className="space-y-3">
          {data.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between rounded-2xl border border-[#3d171c] bg-[#180709] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-sm font-medium text-[#f5dfd9]">{slice.label}</span>
              </div>
              <span className="text-sm font-semibold text-white">{slice.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

export function RadarChartPanel({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: RadarMetric[];
}) {
  const size = 280;
  const center = size / 2;
  const radius = 95;
  const levels = 4;
  const maxValue = getMax(data.map((item) => item.value));

  const points = data.map((item, index) => {
    const angle = (360 / data.length) * index;
    const point = polarToCartesian(center, center, (item.value / maxValue) * radius, angle);
    const label = polarToCartesian(center, center, radius + 30, angle);
    return { ...item, ...point, labelX: label.x, labelY: label.y };
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-72 w-full max-w-[320px]">
          {Array.from({ length: levels }).map((_, levelIndex) => {
            const levelRadius = (radius / levels) * (levelIndex + 1);
            const polygonPoints = data
              .map((_, index) => polarToCartesian(center, center, levelRadius, (360 / data.length) * index))
              .map((point) => `${point.x},${point.y}`)
              .join(" ");
            return <polygon key={levelIndex} points={polygonPoints} fill="none" stroke="#3a171c" />;
          })}
          {data.map((_, index) => {
            const end = polarToCartesian(center, center, radius, (360 / data.length) * index);
            return <line key={index} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#3a171c" />;
          })}
          <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="rgba(255,138,154,0.18)" stroke="#ff8a9a" strokeWidth="2.5" />
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="4" fill={point.color ?? "#ffd7de"} />
              <text x={point.labelX} y={point.labelY} textAnchor="middle" fill="#c5a19a" fontSize="11">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </ChartCard>
  );
}

export function GaugeChartPanel({
  title,
  subtitle,
  value,
  goal = 100,
}: {
  title: string;
  subtitle?: string;
  value: number;
  goal?: number;
}) {
  const clamped = Math.min(Math.max(value, 0), goal);
  const angle = (clamped / goal) * 180;
  const arc = describeArc(120, 120, 78, 180, 180 + angle);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex justify-center">
        <svg viewBox="0 0 240 160" className="h-52 w-full max-w-[320px]">
          <path d={describeArc(120, 120, 78, 180, 360)} fill="none" stroke="#2a1015" strokeWidth="22" strokeLinecap="round" />
          <path d={arc} fill="none" stroke="#ff8a9a" strokeWidth="22" strokeLinecap="round" />
          <text x="120" y="100" textAnchor="middle" fill="#fff1ed" fontSize="28" fontWeight="700">
            {Math.round((clamped / goal) * 100)}%
          </text>
          <text x="120" y="124" textAnchor="middle" fill="#b7918a" fontSize="12">
            Reja bajarilishi
          </text>
        </svg>
      </div>
    </ChartCard>
  );
}

export function MixedChartPanel({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
}) {
  const width = 520;
  const height = 230;
  const padding = 20;
  const maxValue = getMax(data.flatMap((item) => [item.bar, item.line]));
  const step = data.length > 0 ? (width - padding * 2) / data.length : 0;
  const linePoints = data.map((item, index) => {
    const x = padding + step * index + step / 2;
    const y = height - padding - ((item.line / maxValue) * (height - padding * 2));
    return { x, y, ...item };
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-64 w-full">
        {data.map((item, index) => {
          const barHeight = (item.bar / maxValue) * (height - padding * 2);
          const x = padding + step * index + step * 0.18;
          const y = height - padding - barHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={step * 0.64} height={barHeight} rx="12" fill="#4c1720" />
              <text x={x + step * 0.32} y={height + 20} textAnchor="middle" fill="#b7918a" fontSize="11">
                {item.label}
              </text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#ff98aa" strokeWidth="3.5" points={linePoints.map((point) => `${point.x},${point.y}`).join(" ")} />
        {linePoints.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="4.5" fill="#ffd7de" />
        ))}
      </svg>
    </ChartCard>
  );
}
