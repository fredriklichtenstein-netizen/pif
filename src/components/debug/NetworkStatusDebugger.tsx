
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Activity } from "lucide-react";
import { useNetworkDebugger } from "@/hooks/debug/useNetworkDebugger";
import { NetworkStatusIndicator } from "./NetworkStatusIndicator";
import { EndpointStatusList } from "./EndpointStatusList";
import { NetworkDebugLogs } from "./NetworkDebugLogs";

export function NetworkStatusDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const {
    isInDevMode,
    isOnline,
    isRunningTest,
    endpoints,
    logs,
    testConnection,
    clearLogs
  } = useNetworkDebugger();

  if (!isInDevMode) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 bg-gray-800 text-white opacity-75 hover:opacity-100 z-50"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? "Hide Network Debug" : "Debug Network"}
      </Button>
      
      {isVisible && (
        <Card className="fixed bottom-16 right-4 w-96 shadow-lg z-50 bg-white border border-gray-200 p-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Network Status Debugger</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsVisible(false)}
            >
              Close
            </Button>
          </div>
          
          <NetworkStatusIndicator isOnline={isOnline} />
          
          <Tabs defaultValue="endpoints">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="endpoints" className="flex-1">Endpoints</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoints" className="h-[300px] overflow-auto">
              <EndpointStatusList endpoints={endpoints} />
            </TabsContent>
            
            <TabsContent value="logs">
              <NetworkDebugLogs logs={logs} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 flex justify-between">
            <Button 
              variant="default" 
              onClick={testConnection} 
              disabled={isRunningTest}
              className="flex items-center"
            >
              {isRunningTest ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              {isRunningTest ? "Testing..." : "Test Connection"}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={clearLogs}
              size="sm"
            >
              Clear
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
