import TopBar from "@/components/layout/topbar";

export default function Reports() {
  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Reports" 
        subtitle="Analyze your sales performance and metrics"
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-8 text-center">
          <div className="text-gray-500 dark:text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">Reports & Analytics</h3>
            <p>Advanced reporting and analytics features coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
