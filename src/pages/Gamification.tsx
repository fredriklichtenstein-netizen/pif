import { GamificationHub } from "@/components/gamification/GamificationHub";
import { MainNav } from "@/components/MainNav";

const Gamification = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <GamificationHub />
      </div>
      <MainNav />
    </>
  );
};

export default Gamification;