interface LeadScoreData {
  hot: number;
  warm: number;
  cold: number;
  new: number;
}

interface LeadScoreDistributionProps {
  data?: LeadScoreData;
}

export default function LeadScoreDistribution({ data }: LeadScoreDistributionProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Lead Score Distribution</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading distribution...</div>
        </div>
      </div>
    );
  }

  const total = data.hot + data.warm + data.cold + data.new;
  
  const scoreData = [
    {
      label: "Hot (80-100)",
      count: data.hot,
      percentage: total > 0 ? (data.hot / total) * 100 : 0,
      color: "bg-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      label: "Warm (50-79)",
      count: data.warm,
      percentage: total > 0 ? (data.warm / total) * 100 : 0,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      label: "Cold (20-49)",
      count: data.cold,
      percentage: total > 0 ? (data.cold / total) * 100 : 0,
      color: "bg-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "New (0-19)",
      count: data.new,
      percentage: total > 0 ? (data.new / total) * 100 : 0,
      color: "bg-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-900/30",
    },
  ];

  return (
    <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Lead Score Distribution</h3>
        <button className="text-sm text-primary hover:text-primary/80">
          Manage Scoring
        </button>
      </div>
      <div className="space-y-4">
        {scoreData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
              <span className="text-sm font-medium text-gray-900 dark:text-foreground">
                {item.label}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className={`h-2 ${item.color} rounded-full`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-muted-foreground min-w-[2rem] text-right">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
