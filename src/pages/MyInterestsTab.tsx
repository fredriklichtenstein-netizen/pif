
import { InterestedPifsGrid } from "@/components/profile/InterestedPifsGrid";

export function MyInterestsTab({ userId }: { userId: string }) {
  return <InterestedPifsGrid userId={userId} />;
}
