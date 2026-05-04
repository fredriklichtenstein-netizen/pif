
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InterestTextProps {
  users: any[];
}

export function InterestText({ users }: InterestTextProps) {
  const { t } = useTranslation();

  const validUsers = users.filter(
    (user) => user && (user.users?.first_name || user.profiles?.first_name),
  );

  if (validUsers.length === 0) return null;

  const nameOf = (u: any) =>
    u.users?.first_name || u.profiles?.first_name || t("interactions.interested");

  let interestText = "";
  if (validUsers.length === 1) {
    interestText = t("interactions.someone_interested", { name: nameOf(validUsers[0]) });
  } else if (validUsers.length === 2) {
    interestText = t("interactions.two_interested", {
      name1: nameOf(validUsers[0]),
      name2: nameOf(validUsers[1]),
    });
  } else {
    interestText = t("interactions.many_interested", {
      name: nameOf(validUsers[0]),
      count: validUsers.length - 1,
    });
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2">
      <Heart className="h-5 w-5 text-primary fill-primary" />
      <span className="hover:underline">{interestText}</span>
    </div>
  );
}
