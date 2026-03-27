
import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface LocationPermissionManagerProps {
  onLocationEnabled: () => void;
  onLocationDenied: () => void;
}

export const LocationPermissionManager = ({ onLocationEnabled, onLocationDenied }: LocationPermissionManagerProps) => {
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    checkPermissionState();
  }, []);

  const checkPermissionState = async () => {
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionState(permission.state);
      
      permission.addEventListener('change', () => {
        setPermissionState(permission.state);
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      setPermissionState('unknown');
    }
  };

  const requestLocation = async () => {
    setIsRequesting(true);
    
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionState('granted');
            onLocationEnabled();
            resolve(position);
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setPermissionState('denied');
              onLocationDenied();
            }
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });
    } catch (error) {
      console.error('Location request failed:', error);
      toast({
        variant: "destructive",
        title: t('map.location_error'),
        description: t('map.location_error_description'),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const openBrowserSettings = () => {
    toast({
      title: t('map.enable_location'),
      description: t('map.enable_location_description'),
      duration: 5000,
    });
  };

  if (permissionState === 'granted') {
    return null;
  }

  if (permissionState === 'denied') {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background rounded-lg p-4 shadow-lg border border-destructive/30 max-w-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('map.location_blocked')}</p>
            <p className="text-xs text-muted-foreground">{t('map.location_blocked_description')}</p>
          </div>
        </div>
        <Button 
          onClick={openBrowserSettings}
          size="sm" 
          variant="outline" 
          className="w-full mt-3 flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {t('map.browser_settings')}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background rounded-lg p-4 shadow-lg border border-primary/30 max-w-sm">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{t('map.enable_location')}</p>
          <p className="text-xs text-muted-foreground">{t('map.see_distances')}</p>
        </div>
      </div>
      <Button 
        onClick={requestLocation}
        disabled={isRequesting}
        size="sm" 
        className="w-full mt-3"
      >
        {isRequesting ? t('map.requesting') : t('map.enable_location')}
      </Button>
    </div>
  );
};
