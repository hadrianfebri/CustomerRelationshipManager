import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PipelineData {
  prospecting: number;
  qualified: number;
  proposal: number;
  negotiation: number;
  closedWon: number;
}

interface PipelineChartProps {
  data?: PipelineData;
}

export default function PipelineChart({ data }: PipelineChartProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Sales Pipeline</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Prospecting", value: data.prospecting, color: "#E5E7EB" },
    { name: "Qualified", value: data.qualified, color: "#FEF3C7" },
    { name: "Proposal", value: data.proposal, color: "#DBEAFE" },
    { name: "Negotiation", value: data.negotiation, color: "#F3E8FF" },
    { name: "Closed Won", value: data.closedWon, color: "#D1FAE5" },
  ];

  return (
    <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Sales Pipeline</h3>
        <button className="text-sm text-primary hover:text-primary/80">
          View Details
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
