import { Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useBlockStore } from "@/stores/blockStore";

/** "Blockera <namn>" for any ⋯ menu; opens the shared confirmation dialog. */
export function BlockUserMenuItem({ userId, name }: { userId?: string | null; name?: string | null }) {
  const { t } = useTranslation();
  const requestBlock = useBlockStore((s) => s.requestBlock);
  if (!userId) return null;
  const first = name?.trim().split(" ")[0];
  return (
    <DropdownMenuItem
      onClick={() => requestBlock({ id: String(userId), name: name?.trim() || undefined })}
      className="text-destructive"
    >
      <Ban className="mr-2 h-4 w-4" />
      <span>{first ? t("blocking.menu_block", { name: first }) : t("blocking.menu_block_generic")}</span>
    </DropdownMenuItem>
  );
}
