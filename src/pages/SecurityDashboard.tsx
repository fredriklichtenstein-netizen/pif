import { SecurityDashboard } from "@/components/auth/SecurityDashboard";
import { MainNav } from "@/components/MainNav";

const SecurityDashboardPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto px-4 py-6">
          <SecurityDashboard />
        </div>
      </div>
      <MainNav />
    </>
  );
};

export default SecurityDashboardPage;