import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * "Tillbaka" on the terms and privacy pages: back to where the person came
 * from (Settings, sign-in, …). Opened straight from a link, there is no in-app
 * history (location.key "default"), so it goes to the start page instead.
 */
export function LegalBackButton({ label }: { label: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1"
      onClick={() => (location.key !== "default" ? navigate(-1) : navigate("/"))}
    >
      <ArrowLeft size={16} />
      {label}
    </Button>
  );
}
