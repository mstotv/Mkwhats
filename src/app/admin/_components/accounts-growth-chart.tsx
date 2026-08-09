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
      <div className="rounded-lg border border-slate-800 bg-slate-900/95 p-3 shadow-lg backdrop-blur-md text-xs font-sans">
        <p className="text-slate-400 mb-1 text-[11px]">{label}</p>
        <p className="font-semibold text-slate-100 flex items-center gap-2">
          <span>حسابات جديدة:</span>
          <span className="font-mono text-indigo-400 text-sm font-bold">
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
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#1e293b"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#stripeGradient)"
            activeDot={{ r: 4, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
