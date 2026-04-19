import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { usePifAddress } from "@/hooks/usePifAddress";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface UsePifAddressButtonProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export function UsePifAddressButton({ onSelect, className }: UsePifAddressButtonProps) {
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
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      <Home className="h-3.5 w-3.5 mr-1.5" />
      {t("interactions.use_pif_address")}
    </Button>
  );
}
