
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function PrivacySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const requestDataExport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // In a real app, this would trigger a background job
      // For now, we'll just simulate the request with a toast
      
      toast({
        title: "Data export requested",
        description: "We'll email you when your data is ready to download",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Privacy Policies</h3>
        <p className="text-sm text-gray-500">
          Review our privacy policy and terms of service.
        </p>
        <div className="space-y-2">
          <a 
            href="#privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            Privacy Policy <ExternalLink className="ml-1 h-4 w-4" />
          </a>
          <a 
            href="#terms-of-service" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            Terms of Service <ExternalLink className="ml-1 h-4 w-4" />
          </a>
          <a 
            href="#cookie-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            Cookie Policy <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Data</h3>
        <p className="text-sm text-gray-500">
          Download a copy of your data or request data deletion.
        </p>
        
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={requestDataExport}
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          {loading ? "Requesting..." : "Request data export"}
        </Button>
      </div>
    </div>
  );
}
