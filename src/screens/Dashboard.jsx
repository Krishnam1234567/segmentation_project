import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { StatusChip } from '../components/StatusChip';
import { fetchFromAPI } from '../utils/api';
import {
  Shield,
  FileText,
  Scale,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromAPI('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading dashboard data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load dashboard data</div>;

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Enterprise Dashboard</h2>
        <p className="text-sm text-muted-foreground">Legal operations overview and AI insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Legal Risk Score" value={data.legal_risk_score} change={data.legal_risk_change} changeType="positive" icon={Shield} iconColor="bg-accent/10 text-accent" />
        <StatCard title="Active Contracts" value={data.active_contracts} change={data.active_contracts_change} changeType="positive" icon={FileText} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Litigation Risk" value={data.litigation_risk} change={data.litigation_risk_change} changeType="neutral" icon={Scale} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Compliance Rate" value={data.compliance_rate} change={data.compliance_rate_change} changeType="positive" icon={CheckCircle} iconColor="bg-accent/10 text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Risk & Compliance Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.risk_trend_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
              <Legend />
              <Area type="monotone" dataKey="risk" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} name="Risk Score" />
              <Area type="monotone" dataKey="compliance" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Compliance %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Litigation by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.litigation_data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {data.litigation_data.map((entry, index) => (
                  <Cell key={`litigation-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Global Jurisdiction Exposure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.jurisdiction_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
              <Legend />
              <Bar dataKey="contracts" fill="#2563EB" name="Active Contracts" />
              <Bar dataKey="risk" fill="#F59E0B" name="Risk Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Optimize Contract Renewals</p>
                  <p className="text-xs text-muted-foreground mt-1">12 contracts expiring soon. Auto-renewal recommended for 8.</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Compliance Gap Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">New CCPA requirements need attention in 3 jurisdictions.</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Governance Audit Ready</p>
                  <p className="text-xs text-muted-foreground mt-1">All board resolutions documented. Q2 audit cleared.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {data.upcoming_deadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{deadline.date}</p>
                  </div>
                </div>
                <RiskBadge level={deadline.risk} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {data.recent_alerts.map((alert) => (
              <div key={alert.id} className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    alert.severity === 'high' ? 'bg-destructive' :
                    alert.severity === 'medium' ? 'bg-warning' : 'bg-accent'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
