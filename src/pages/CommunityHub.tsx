import { CommunityHub } from "@/components/community/CommunityHub";
import { MainNav } from "@/components/MainNav";

const CommunityHubPage = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto px-4 py-6">
          <CommunityHub />
        </div>
      </div>
      <MainNav />
    </>
  );
};

export default CommunityHubPage;