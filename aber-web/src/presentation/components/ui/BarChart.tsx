import type { JSX } from 'react';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  ariaLabel: string;
}

const HEIGHT = 120;
const BAR_WIDTH = 16;
const GAP = 8;

// Plain SVG bars, no chart library. The SVG is forced LTR so days read left to right.
export function BarChart({ data, ariaLabel }: BarChartProps): JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = data.length * (BAR_WIDTH + GAP);
  return (
    <div dir="ltr" className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT + 18}`}
        role="img"
        aria-label={ariaLabel}
        className="h-40 w-full min-w-[320px]"
      >
        {data.map((d, i) => {
          const h = (d.value / max) * HEIGHT;
          const x = i * (BAR_WIDTH + GAP) + GAP / 2;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${d.value}`}</title>
              <rect
                x={x}
                y={HEIGHT - h}
                width={BAR_WIDTH}
                height={h}
                rx="2"
                className="fill-navy-700"
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={HEIGHT + 12}
                textAnchor="middle"
                fontSize="7"
                className="fill-muted"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
