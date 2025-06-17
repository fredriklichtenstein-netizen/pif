
import { Share } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  itemId: string;
  onShareClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export function ShareButton({ onShareClick, disabled = false }: ShareButtonProps) {
  const { t } = useTranslation();
  
  return (
    <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
      <button 
        disabled={disabled}
        onClick={onShareClick}
        className={`flex flex-col items-center w-full rounded group
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-label={t('interactions.share')}
        tabIndex={0}
      >
        <div className="flex items-center justify-center h-7">
          <Share className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex flex-row items-center justify-center mt-1 gap-1">
          <span className="text-xs font-medium text-gray-600 select-none">
            {t('interactions.share')}
          </span>
        </div>
      </button>
    </div>
  );
}
