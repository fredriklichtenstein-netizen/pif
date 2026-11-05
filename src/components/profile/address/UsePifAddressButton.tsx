import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { usePifAddress } from "@/hooks/usePifAddress";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { cn } from "@/lib/utils";

interface UsePifAddressButtonProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  /** The field currently holds the PIF address -- show the button as selected. */
  active?: boolean;
  className?: string;
}

export function UsePifAddressButton({ onSelect, active = false, className }: UsePifAddressButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const { fetchPifAddress, isLoading } = usePifAddress();

  const handleClick = async () => {
    if (!user) {
      toast({
        title: t("interactions.pif_address_not_found_title"),
        description: t("interactions.pif_address_login_required"),
        variant: "destructive",
      });
      return;
    }

    const result = await fetchPifAddress();
    if (!result.address || !result.coordinates) {
      toast({
        title: t("interactions.pif_address_not_found_title"),
        description: t("interactions.pif_address_not_found_description"),
        variant: "destructive",
      });
      return;
    }

    onSelect(result.address, result.coordinates);
  };

  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={active}
      aria-label={t("interactions.use_pif_address")}
      title={t("interactions.use_pif_address")}
      className={cn("shrink-0", active && "shadow-sm", className)}
    >
      <Home className="h-4 w-4" />
    </Button>
  );
}
