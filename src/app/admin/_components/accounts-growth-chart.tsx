'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export interface GrowthDataPoint {
  date: string
  count: number
}

interface AccountsGrowthChartProps {
  data: GrowthDataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md text-xs font-sans">
        <p className="text-muted-foreground mb-1 text-[11px] font-bold">{label}</p>
        <p className="font-bold text-foreground flex items-center gap-2">
          <span>حسابات جديدة:</span>
          <span className="font-mono text-emerald-500 text-sm font-black">
            {payload[0].value}
          </span>
        </p>
      </div>
    )
  }
  return null
}

export function AccountsGrowthChart({ data }: AccountsGrowthChartProps) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="stripeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-border opacity-40"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-muted-foreground"
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#stripeGradient)"
            activeDot={{ r: 5, fill: '#10b981', stroke: '#020617', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
