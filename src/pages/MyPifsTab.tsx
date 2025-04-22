
import { UserPifsList } from "@/components/profile/UserPifsList";

export function MyPifsTab({ userId }: { userId: string }) {
  return <UserPifsList userId={userId} />;
}
