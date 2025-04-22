
import { InterestsInMyPifsList } from "@/components/profile/InterestsInMyPifsList";

export function InterestsInMyPifsTab({ userId }: { userId: string }) {
  return <InterestsInMyPifsList userId={userId} />;
}
