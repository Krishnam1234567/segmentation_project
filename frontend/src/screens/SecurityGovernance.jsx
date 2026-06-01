import { useState, useEffect } from 'react';
import { Lock, Shield, Users, Eye, AlertTriangle, CheckCircle, Activity, Search, Filter, ChevronRight, Download, Settings, Zap, Bell, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchFromAPI } from '../utils/api';

const levelConfig = {
  admin:    { color: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Admin' },
  senior:   { color: 'bg-primary/10 text-primary border-primary/30',             label: 'Senior' },
  standard: { color: 'bg-accent/10 text-accent border-accent/30',                label: 'Standard' },
  external: { color: 'bg-warning/10 text-warning border-warning/30',             label: 'External' },
  observer: { color: 'bg-muted text-muted-foreground border-border',             label: 'Observer' },
};
const severityConfig = {
  high:   { color: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  medium: { color: 'bg-warning/10 text-warning',         dot: 'bg-warning' },
  low:    { color: 'bg-accent/10 text-accent',           dot: 'bg-accent' },
};

export function Security() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [logSearch, setLogSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchFromAPI('/security')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runThreatAnalysis = async () => {
    setAiLoading(true); setAiAnalysis(null);
    try {
      const res = await fetch('/api/security/threat-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: 'Enterprise Legal Platform Security Posture',
          context: `Security score ${data?.summary?.security_score}. ${data?.summary?.alerts} active alerts (${data?.summary?.high_severity_alerts} high severity). ${data?.summary?.ai_actions_24h} AI actions in last 24h with ${data?.summary?.ai_human_reviewed} human-reviewed.`,
        }),
      });
      const d = await res.json();
      setAiAnalysis(d.analysis);
    } catch (e) {
      setAiAnalysis('AI threat analysis unavailable. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading security data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load security data</div>;

  const s = data.summary;
  const filteredLogs = data.audit_logs?.filter(l =>
    !logSearch || l.user.toLowerCase().includes(logSearch.toLowerCase()) || l.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  const tabs = [
    { id: 'overview',      label: 'Overview',            icon: Shield },
    { id: 'roles',         label: 'Roles & Permissions', icon: Users },
    { id: 'audit',         label: 'Audit Logs',          icon: Eye },
    { id: 'ai-governance', label: 'AI Governance',       icon: Zap },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Security & AI Governance</h2>
          <p className="text-sm text-muted-foreground">Role management, audit logs, and AI safety controls</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runThreatAnalysis}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {aiLoading ? 'Analyzing...' : 'AI Threat Analysis'}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/30 text-sm">
            <Download className="w-4 h-4" />Export Logs
          </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Gemini AI Threat Analysis</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Security Score',    value: s.security_score,   sub: 'Enterprise grade',                         icon: Shield, color: 'text-accent',       bg: 'bg-accent/10' },
              { label: 'Active Users',      value: s.active_users,     sub: `${s.external_users} external`,             icon: Users,  color: 'text-primary',      bg: 'bg-primary/10' },
              { label: 'AI Actions (24h)',  value: s.ai_actions_24h,   sub: `${s.ai_human_reviewed} human-reviewed`,    icon: Zap,    color: 'text-purple-500',   bg: 'bg-purple-500/10' },
              { label: 'Alerts',            value: s.alerts,           sub: `${s.high_severity_alerts} high severity`,  icon: Bell,   color: 'text-warning',      bg: 'bg-warning/10' },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className={`text-xs mt-1 ${color}`}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Access Activity (Today)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.access_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} tickFormatter={v => `${v}:00`} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="accesses" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} name="Accesses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Security Posture</h3>
              <div className="space-y-3">
                {data.security_posture?.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.roles?.map((role) => {
            const lc = levelConfig[role.level];
            return (
              <div key={role.id} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div><h4 className="text-sm font-semibold text-foreground">{role.name}</h4><p className="text-xs text-muted-foreground">{role.users} user{role.users !== 1 ? 's' : ''}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${lc.color}`}>{lc.label}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.map(p => <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{p}</span>)}
                </div>
                <button className="mt-3 text-xs text-primary hover:underline flex items-center gap-1">Edit Permissions <ChevronRight className="w-3 h-3" /></button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search logs by user or action..."
                className="w-full pl-8 pr-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/30 text-sm"><Filter className="w-4 h-4" />Filter</button>
          </div>
          <div className="divide-y divide-border">
            {filteredLogs?.map((log) => {
              const sc = severityConfig[log.severity];
              return (
                <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-foreground">{log.user}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${sc.color}`}>{log.severity}</span>
                        <span className="text-xs text-muted-foreground">{log.resource}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.action}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{log.time}</span><span>IP: {log.ip}</span><span className="text-xs text-primary">{log.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'ai-governance' && (
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">AI Governance Framework Active</p>
              <p className="text-sm text-muted-foreground">All AI actions on LexOS are governed by your organization's AI policy. Human oversight controls are enforced at the system level.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.ai_governance_policies?.map((policy) => (
              <div key={policy.name} className={`bg-card border rounded-lg p-4 ${policy.status === 'warning' ? 'border-warning/30' : 'border-border'}`}>
                <div className="flex items-start gap-3">
                  {policy.status === 'active'
                    ? <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{policy.description}</p>
                    <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${policy.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                      {policy.status === 'active' ? 'Enforced' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
