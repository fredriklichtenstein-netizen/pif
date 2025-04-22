
import { MyInterestsList } from "@/components/profile/MyInterestsList";

export function MyInterestsTab({ userId }: { userId: string }) {
  return <MyInterestsList userId={userId} />;
}
