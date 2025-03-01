
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NotificationToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function NotificationToggle({ id, label, checked, onToggle }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="flex-grow">
        {label}
      </Label>
      <Switch 
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
