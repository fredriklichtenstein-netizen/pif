
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap, Brain, AlertTriangle } from "lucide-react";
import { performanceMetrics } from "@/services/performance/metrics";
import { performanceAnalytics } from "@/services/performance/analytics";
import { memoryOptimizer } from "@/services/performance/memory";

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any[]>([]);

  const isInDevMode = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const newReport = performanceAnalytics.generateReport();
      setReport(newReport);
      
      const memory = memoryOptimizer.getMemoryUsage();
      setMemoryUsage(memory);
      
      const recent = performanceMetrics.getMetrics().slice(-10);
      setRealtimeMetrics(recent);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  const exportData = () => {
    const data = performanceAnalytics.exportMetrics('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isInDevMode) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 left-4 bg-blue-600 text-white opacity-75 hover:opacity-100 z-50"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? "Hide Performance" : "Performance Monitor"}
      </Button>
      
      {isVisible && (
        <Card className="fixed bottom-16 left-4 w-[500px] shadow-lg z-50 bg-white border border-gray-200 p-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance Monitor
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
                Close
              </Button>
            </div>
          </div>
          
          {memoryUsage && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-1" />
                  Memory Usage
                </span>
                <Badge variant={memoryUsage.usagePercentage > 80 ? "destructive" : "secondary"}>
                  {memoryUsage.usagePercentage}%
                </Badge>
              </div>
              <Progress value={memoryUsage.usagePercentage} className="mb-1" />
              <div className="text-xs text-gray-500">
                {memoryUsage.used}MB / {memoryUsage.limit}MB
              </div>
            </div>
          )}
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="metrics" className="flex-1">Live Metrics</TabsTrigger>
              <TabsTrigger value="recommendations" className="flex-1">Tips</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="h-[300px] overflow-auto">
              {report && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600">Avg Page Load</div>
                      <div className="font-semibold text-blue-800">
                        {report.metrics.avgPageLoad.toFixed(0)}ms
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-xs text-green-600">Avg API Request</div>
                      <div className="font-semibold text-green-800">
                        {report.metrics.avgApiRequest.toFixed(0)}ms
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <div className="text-xs text-purple-600">Avg Render</div>
                      <div className="font-semibold text-purple-800">
                        {report.metrics.avgComponentRender.toFixed(0)}ms
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <div className="text-xs text-orange-600">Peak Memory</div>
                      <div className="font-semibold text-orange-800">
                        {report.metrics.memoryUsage.peak.toFixed(0)}MB
                      </div>
                    </div>
                  </div>
                  
                  {(report.issues.critical > 0 || report.issues.warnings > 0) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center text-yellow-800 font-medium mb-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Issues Detected
                      </div>
                      <div className="text-sm text-yellow-700">
                        {report.issues.critical > 0 && (
                          <div>🔴 Critical: {report.issues.critical}</div>
                        )}
                        {report.issues.warnings > 0 && (
                          <div>⚠️ Warnings: {report.issues.warnings}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="h-[300px] overflow-auto">
              <div className="space-y-2">
                {realtimeMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 mr-2 text-blue-500" />
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {metric.value.toFixed(0)}ms
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recommendations" className="h-[300px] overflow-auto">
              {report && (
                <div className="space-y-3">
                  {report.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-start">
                        <TrendingUp className="h-4 w-4 mr-2 text-blue-600 mt-0.5" />
                        <span className="text-sm text-blue-800">{rec}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </>
  );
}
