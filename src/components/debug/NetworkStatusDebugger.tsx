
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkNetworkConnection } from "@/hooks/auth/networkUtils";
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  Activity, 
  Check, 
  X 
} from "lucide-react";

export function NetworkStatusDebugger() {
  const [isInDevMode] = useState(process.env.NODE_ENV === 'development');
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [endpoints, setEndpoints] = useState([
    { name: 'Google', url: 'https://www.google.com', status: 'pending', latency: null },
    { name: 'Supabase API', url: 'https://fzejimpdheswqrojjvmf.supabase.co/rest/v1/profiles?select=id&limit=1', status: 'pending', latency: null },
    { name: 'Supabase Auth', url: 'https://fzejimpdheswqrojjvmf.supabase.co/auth/v1/token', status: 'pending', latency: null },
  ]);
  const [logs, setLogs] = useState<string[]>([]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      addLog('Browser reported online event');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      addLog('Browser reported offline event');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const testConnection = async () => {
    setIsRunningTest(true);
    addLog('Starting connectivity tests...');
    
    // Test browser's online status
    const browserOnline = navigator.onLine;
    addLog(`Browser reports ${browserOnline ? 'online' : 'offline'}`);
    
    // Test our utility function
    const utilityCheck = await checkNetworkConnection();
    addLog(`Network utility reports ${utilityCheck ? 'online' : 'offline'}`);
    
    // Update status based on most reliable method
    setIsOnline(utilityCheck);
    
    // Test individual endpoints
    const newEndpoints = [...endpoints];
    
    for (let i = 0; i < newEndpoints.length; i++) {
      const endpoint = newEndpoints[i];
      addLog(`Testing endpoint: ${endpoint.name}`);
      
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          headers: {
            'Accept-Profile': 'public',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZWppbXBkaGVzd3Fyb2pqdm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0ODQxODMsImV4cCI6MjA1NDA2MDE4M30.6qpLWft1lH72USjBjmPd7enwQ0sy06ouZkds64UZVI0',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        newEndpoints[i] = {
          ...endpoint,
          status: 'success',
          latency
        };
        
        addLog(`✅ ${endpoint.name} is reachable (${latency}ms)`);
      } catch (error) {
        newEndpoints[i] = {
          ...endpoint,
          status: 'error',
          latency: null
        };
        
        addLog(`❌ ${endpoint.name} is not reachable: ${error}`);
      }
      
      setEndpoints(newEndpoints);
    }
    
    setIsRunningTest(false);
    addLog('Connectivity tests completed');
  };

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
          
          <div className="flex items-center space-x-2 mb-4 p-2 rounded bg-gray-50">
            {isOnline ? 
              <Wifi className="h-5 w-5 text-green-500" /> : 
              <WifiOff className="h-5 w-5 text-red-500" />
            }
            <div>
              <div className="font-medium">
                {isOnline ? "Connected" : "Disconnected"}
              </div>
              <div className="text-xs text-gray-500">
                {isOnline ? 
                  "Application is online and can reach backend services" : 
                  "Application is offline or can't reach backend services"
                }
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="endpoints">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="endpoints" className="flex-1">Endpoints</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoints" className="h-[300px] overflow-auto">
              <div className="space-y-2">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{endpoint.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{endpoint.url}</div>
                    </div>
                    <div className="flex items-center">
                      {endpoint.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                      {endpoint.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
                      {endpoint.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                      
                      {endpoint.latency !== null && (
                        <span className="ml-2 text-xs text-gray-500">
                          {endpoint.latency}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="h-[300px] overflow-auto bg-gray-50 p-2 rounded text-xs font-mono">
              {logs.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No logs yet. Run a test to see results.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
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
              onClick={() => {
                addLog('Cleared logs');
                setLogs([]);
                setEndpoints(endpoints.map(e => ({ ...e, status: 'pending', latency: null })));
              }}
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
