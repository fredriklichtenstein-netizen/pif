
import { MyPifsGrid } from "@/components/profile/MyPifsGrid";

export function MyPifsTab({ userId }: { userId: string }) {
  return <MyPifsGrid userId={userId} />;
}
