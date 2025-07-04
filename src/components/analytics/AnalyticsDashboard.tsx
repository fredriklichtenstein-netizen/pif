import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Activity,
  Calendar,
  Clock,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { performanceAnalytics } from "@/services/performance/analytics";

interface AnalyticsData {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
  };
  contentMetrics: {
    totalPifs: number;
    completedPifs: number;
    activePifs: number;
    completionRate: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalMessages: number;
    engagementRate: number;
  };
  performance: {
    avgPageLoad: number;
    avgApiResponse: number;
    errorRate: number;
    uptime: number;
  };
}

interface ChartData {
  name: string;
  users: number;
  pifs: number;
  engagement: number;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
    fetchChartData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, created_at");

      const { data: items } = await supabase
        .from("items")
        .select("id, pif_status, created_at");

      const { data: likes } = await supabase
        .from("likes")
        .select("id");

      const { data: comments } = await supabase
        .from("comments")
        .select("id");

      const { data: messages } = await supabase
        .from("messages")
        .select("id");

      // Calculate metrics
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const totalUsers = profiles?.length || 0;
      const newUsers = profiles?.filter(p => new Date(p.created_at) >= cutoffDate).length || 0;
      const activeUsers = Math.floor(totalUsers * 0.6); // Simulated active users

      const totalPifs = items?.length || 0;
      const completedPifs = items?.filter(item => item.pif_status === 'completed').length || 0;
      const activePifs = items?.filter(item => item.pif_status === 'active').length || 0;

      const totalLikes = likes?.length || 0;
      const totalComments = comments?.length || 0;
      const totalMessages = messages?.length || 0;

      // Get performance metrics
      const performanceReport = performanceAnalytics.generateReport();

      setAnalyticsData({
        userActivity: {
          totalUsers,
          activeUsers,
          newUsers,
          userGrowth: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0
        },
        contentMetrics: {
          totalPifs,
          completedPifs,
          activePifs,
          completionRate: totalPifs > 0 ? (completedPifs / totalPifs) * 100 : 0
        },
        engagement: {
          totalLikes,
          totalComments,
          totalMessages,
          engagementRate: totalUsers > 0 ? ((totalLikes + totalComments) / totalUsers) * 100 : 0
        },
      performance: {
        avgPageLoad: performanceReport.metrics.avgPageLoad,
        avgApiResponse: performanceReport.metrics.avgApiRequest,
        errorRate: (performanceReport.issues.critical / Math.max(performanceReport.issues.critical + performanceReport.issues.warnings, 1)) * 100,
        uptime: 99.2 // Simulated uptime
      }
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Generate mock time series data
    const data: ChartData[] = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        name: date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 50) + 20,
        pifs: Math.floor(Math.random() * 30) + 10,
        engagement: Math.floor(Math.random() * 100) + 50
      });
    }
    
    setChartData(data);
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    suffix = '',
    color = 'blue' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    suffix?: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()}{suffix}
        </div>
        {change !== undefined && (
          <div className={`text-xs flex items-center gap-1 mt-1 ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-3 w-3" />
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading || !analyticsData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const engagementData = [
    { name: 'Likes', value: analyticsData.engagement.totalLikes, color: '#ff6b6b' },
    { name: 'Comments', value: analyticsData.engagement.totalComments, color: '#4ecdc4' },
    { name: 'Messages', value: analyticsData.engagement.totalMessages, color: '#45b7d1' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Track performance and user activity across the PIF platform</p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </Badge>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={analyticsData.userActivity.totalUsers}
          change={analyticsData.userActivity.userGrowth}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active PIFs"
          value={analyticsData.contentMetrics.activePifs}
          change={15.3}
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Engagement Rate"
          value={analyticsData.engagement.engagementRate}
          change={8.2}
          icon={Heart}
          suffix="%"
          color="red"
        />
        <MetricCard
          title="Completion Rate"
          value={analyticsData.contentMetrics.completionRate}
          change={-2.1}
          icon={Activity}
          suffix="%"
          color="purple"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pifs" 
                      stackId="1" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="New Users"
              value={analyticsData.userActivity.newUsers}
              change={12.5}
              icon={Users}
              color="green"
            />
            <MetricCard
              title="Active Users"
              value={analyticsData.userActivity.activeUsers}
              change={5.2}
              icon={Activity}
              color="blue"
            />
            <MetricCard
              title="User Growth"
              value={analyticsData.userActivity.userGrowth}
              change={3.8}
              icon={TrendingUp}
              suffix="%"
              color="purple"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total PIFs"
              value={analyticsData.contentMetrics.totalPifs}
              change={18.3}
              icon={Target}
              color="blue"
            />
            <MetricCard
              title="Completed PIFs"
              value={analyticsData.contentMetrics.completedPifs}
              change={22.1}
              icon={Activity}
              color="green"
            />
            <MetricCard
              title="Active PIFs"
              value={analyticsData.contentMetrics.activePifs}
              change={-5.2}
              icon={Clock}
              color="orange"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Creation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pifs" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Avg Page Load"
              value={analyticsData.performance.avgPageLoad}
              change={-8.2}
              icon={Clock}
              suffix="ms"
              color="blue"
            />
            <MetricCard
              title="API Response"
              value={analyticsData.performance.avgApiResponse}
              change={-12.3}
              icon={Activity}
              suffix="ms"
              color="green"
            />
            <MetricCard
              title="Error Rate"
              value={analyticsData.performance.errorRate}
              change={-45.2}
              icon={TrendingUp}
              suffix="%"
              color="red"
            />
            <MetricCard
              title="Uptime"
              value={analyticsData.performance.uptime}
              change={0.1}
              icon={Calendar}
              suffix="%"
              color="green"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceAnalytics.generateReport().recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};