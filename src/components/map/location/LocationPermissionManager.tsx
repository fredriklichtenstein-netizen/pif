
import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LocationPermissionManagerProps {
  onLocationEnabled: () => void;
  onLocationDenied: () => void;
}

export const LocationPermissionManager = ({ onLocationEnabled, onLocationDenied }: LocationPermissionManagerProps) => {
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

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
        title: "Location Error",
        description: "Could not access your location. Please check your browser settings.",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const openBrowserSettings = () => {
    toast({
      title: "Enable Location",
      description: "Please enable location permissions in your browser settings and refresh the page.",
      duration: 5000,
    });
  };

  if (permissionState === 'granted') {
    return null;
  }

  if (permissionState === 'denied') {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-4 shadow-lg border border-red-200 max-w-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Location Blocked</p>
            <p className="text-xs text-gray-600">Enable location to see distances and nearby items</p>
          </div>
        </div>
        <Button 
          onClick={openBrowserSettings}
          size="sm" 
          variant="outline" 
          className="w-full mt-3 flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Browser Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-4 shadow-lg border border-blue-200 max-w-sm">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Enable Location</p>
          <p className="text-xs text-gray-600">See distances and find nearby items</p>
        </div>
      </div>
      <Button 
        onClick={requestLocation}
        disabled={isRequesting}
        size="sm" 
        className="w-full mt-3"
      >
        {isRequesting ? 'Requesting...' : 'Enable Location'}
      </Button>
    </div>
  );
};
