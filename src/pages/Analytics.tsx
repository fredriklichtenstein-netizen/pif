import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { MainNav } from "@/components/MainNav";

const Analytics = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <AnalyticsDashboard />
      </div>
      <MainNav />
    </>
  );
};

export default Analytics;