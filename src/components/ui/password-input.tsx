import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  // The toggle used to overlay the input's own right edge (absolute-
  // positioned inside a relative wrapper). Reported live: on iOS Safari it
  // intermittently vanished while the field was focused -- WebKit draws its
  // own native password/autofill UI (the key-icon "use strong password"
  // suggestion) inside the input's content box on that edge, which can paint
  // over an overlaid custom button. Placing the toggle as a separate sibling
  // outside the input's box entirely sidesteps that overlap regardless of
  // root cause, and stays reachable at all times instead of only when that
  // native UI happens not to be showing.
  return (
    <div className="flex items-center gap-2">
      <Input
        type={visible ? "text" : "password"}
        className={cn("min-w-0 flex-1", className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('common.hide_password') : t('common.show_password')}
        className="shrink-0 p-2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
