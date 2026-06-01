import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, Target, Download, Shield, Loader2, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { fetchFromAPI } from '../utils/api';

export function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6M');
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchFromAPI('/analytics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const generateReport = async () => {
    setReportLoading(true); setReport(null);
    try {
      const res = await fetch('/api/analytics/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, focus_area: 'Legal spend optimization and risk reduction' }),
      });
      const d = await res.json();
      setReport(d.report);
    } catch (e) {
      setReport('Report generation unavailable. Check backend connection.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading analytics data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load analytics data</div>;

  const { kpis, legal_spend, risk_trends, efficiency, matters_by_category, spend_forecast, executive_summary } = data;

  const kpiCards = [
    { label: 'Total Legal Spend',   value: kpis.total_legal_spend, change: kpis.spend_change,      note: 'vs. last year',         icon: DollarSign, color: 'text-primary',     bg: 'bg-primary/10',     trend: 'up'   },
    { label: 'Cost Per Matter',     value: kpis.cost_per_matter,   change: kpis.cost_change,       note: 'AI-driven reduction',   icon: TrendingDown,color:'text-accent',      bg: 'bg-accent/10',      trend: 'down' },
    { label: 'Matter Cycle Time',   value: kpis.matter_cycle_time, change: kpis.cycle_change,      note: 'avg reduction',         icon: Clock,       color: 'text-accent',      bg: 'bg-accent/10',      trend: 'down' },
    { label: 'Prevention Rate',     value: kpis.prevention_rate,   change: kpis.prevention_change, note: 'Issues pre-incident',   icon: Shield,      color: 'text-purple-500',  bg: 'bg-purple-500/10',  trend: 'up'   },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Analytics & Executive Intelligence</h2>
          <p className="text-sm text-muted-foreground">Comprehensive legal KPIs, forecasting, and AI-driven insights</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {['3M', '6M', '1Y', 'YTD'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{p}</button>
            ))}
          </div>
          <button onClick={generateReport} disabled={reportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60">
            {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {reportLoading ? 'Generating...' : 'AI Executive Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Executive Intelligence Report — {period}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{report}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, change, note, icon: Icon, color, bg, trend }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <div className="flex items-center gap-1">
              {trend === 'up' ? <TrendingUp className="w-3 h-3 text-accent" /> : <TrendingDown className="w-3 h-3 text-accent" />}
              <span className="text-xs text-accent font-medium">{change}</span>
              <span className="text-xs text-muted-foreground">· {note}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Legal Spend vs. Budget ($K)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={legal_spend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Legend />
              <Bar dataKey="internal" fill="#2563EB" name="Internal ($K)" stackId="a" radius={[0,0,3,3]} />
              <Bar dataKey="external" fill="#8B5CF6" name="External ($K)" stackId="a" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="budget" stroke="#F59E0B" strokeDasharray="5 5" name="Budget" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Risk Trends by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={risk_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="contractRisk" stroke="#2563EB" name="Contract" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="complianceRisk" stroke="#10B981" name="Compliance" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="litigationRisk" stroke="#EF4444" name="Litigation" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Matters by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={matters_by_category} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                {matters_by_category?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {matters_by_category?.map(m => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} /><span className="text-muted-foreground">{m.name}</span></div>
                <span className="font-medium text-foreground">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">AI vs Manual Time (hrs)</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={efficiency} layout="vertical" barSize={8}>
              <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Legend />
              <Bar dataKey="aiTime" fill="#10B981" name="With AI" radius={[0,3,3,0]} />
              <Bar dataKey="manualTime" fill="#6B7280" name="Manual" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Spend Forecast H2 ($K)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={spend_forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} domain={[400, 750]} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="#2563EB" fillOpacity={0.1} />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="var(--card)" />
              <Line type="monotone" dataKey="forecast" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">Confidence interval shown · AI Model v3.2</p>
        </div>
      </div>

      {executive_summary && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Executive Intelligence Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', title: 'AI Efficiency Gains', body: executive_summary.ai_efficiency },
              { icon: Shield,     color: 'text-warning', bg: 'bg-warning/10', title: 'Priority Risks',    body: executive_summary.priority_risks },
              { icon: BarChart3,  color: 'text-primary', bg: 'bg-primary/10', title: 'Q3 Forecast',       body: executive_summary.q3_forecast },
            ].map(({ icon: Icon, color, bg, title, body }) => (
              <div key={title} className="flex gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 h-fit ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                <div><p className="text-sm font-semibold text-foreground mb-1">{title}</p><p className="text-xs text-muted-foreground leading-relaxed">{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
