import { useState, useEffect } from 'react';
import { Users, Vote, Calendar, FileText, CheckCircle, Clock, TrendingUp, Plus, ChevronRight, Award, Shield, Loader2, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fetchFromAPI } from '../utils/api';

const eventTypeConfig = {
  meeting:    { color: 'bg-primary/10 text-primary', icon: Users },
  esop:       { color: 'bg-accent/10 text-accent', icon: Award },
  agm:        { color: 'bg-warning/10 text-warning', icon: Vote },
  vote:       { color: 'bg-primary/10 text-primary', icon: Vote },
  compliance: { color: 'bg-destructive/10 text-destructive', icon: Shield },
};

const statusConfig = {
  passed:   { color: 'bg-accent/10 text-accent border-accent/30',          label: 'Passed' },
  pending:  { color: 'bg-warning/10 text-warning border-warning/30',       label: 'Pending' },
  rejected: { color: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Rejected' },
};

export function Governance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftText, setDraftText] = useState(null);

  useEffect(() => {
    fetchFromAPI('/governance')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const draftResolution = async () => {
    setDraftLoading(true); setDraftText(null);
    try {
      const res = await fetch('/api/governance/draft-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_type: 'ESOP Grant Authorization', context: 'Authorize issuance of 500,000 stock options to senior employees at $4.20 strike price under the FY2026 ESOP plan' }),
      });
      const d = await res.json();
      setDraftText(d.draft);
    } catch (e) {
      setDraftText('AI drafting unavailable. Check backend connection.');
    } finally {
      setDraftLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading governance data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load governance data</div>;

  const s = data.summary;
  const tabs = [
    { id: 'board',       label: 'Board of Directors', icon: Users },
    { id: 'resolutions', label: 'Board Resolutions',  icon: FileText },
    { id: 'esop',        label: 'ESOP Management',    icon: Award },
    { id: 'calendar',    label: 'Corporate Calendar', icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Governance & Board Management</h2>
          <p className="text-sm text-muted-foreground">Board resolutions, ESOP administration, and shareholder governance</p>
        </div>
        <button onClick={draftResolution} disabled={draftLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60">
          {draftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {draftLoading ? 'Drafting...' : 'Draft AI Resolution'}
        </button>
      </div>

      {draftText && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">AI-Drafted Board Resolution</p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{draftText}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Board Members',    value: s.board_members,         sub: `${data.board_members?.filter(m=>m.independent).length} independent`, icon: Users,      color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Resolutions YTD',  value: s.resolutions_ytd,       sub: 'All passed',              icon: CheckCircle, color: 'text-accent',  bg: 'bg-accent/10' },
          { label: 'ESOP Granted',     value: `${s.esop_granted_pct}%`,sub: 'Of total pool',           icon: Award,       color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Avg Attendance',   value: `${s.avg_attendance}%`,  sub: 'Board meetings',          icon: TrendingUp,  color: 'text-accent',  bg: 'bg-accent/10' },
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

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.board_members?.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">{m.avatar}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{m.name}</h4>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                {m.independent && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">Independent</span>}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {m.committees?.map(c => <span key={c} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{c}</span>)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Tenure</p><p className="text-sm font-medium text-foreground">{m.tenure}</p></div>
                <div><p className="text-xs text-muted-foreground">Attendance</p><p className={`text-sm font-medium ${m.attendance >= 90 ? 'text-accent' : 'text-warning'}`}>{m.attendance}%</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'resolutions' && (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {data.resolutions?.map((r) => (
            <div key={r.id} className="p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusConfig[r.status]?.color}`}>{statusConfig[r.status]?.label}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.id} · {r.date} · {r.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-muted-foreground">For / Against / Abstain</p>
                    <p className="text-sm font-medium text-foreground">{r.votes?.for} / {r.votes?.against} / {r.votes?.abstain}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'esop' && data.esop && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-base font-semibold text-foreground mb-4">ESOP Pool Distribution</h4>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={data.esop.distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {data.esop.distribution?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Total Pool Size</p><p className="text-xl font-bold text-foreground">{data.esop.total_pool_pct}%</p></div>
                <div><p className="text-xs text-muted-foreground">Granted to Employees</p><p className="text-lg font-semibold text-primary">{data.esop.granted_pct}%</p></div>
                <div><p className="text-xs text-muted-foreground">Available Pool</p><p className="text-lg font-semibold text-accent">{data.esop.available_pct}%</p></div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-base font-semibold text-foreground mb-4">Options Vesting (Units)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.esop.vesting_data} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quarter" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Bar dataKey="vested" fill="#2563EB" radius={[3, 3, 0, 0]} name="Vested (K units)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {data.calendar?.map((e, i) => {
            const Cfg = eventTypeConfig[e.type] || eventTypeConfig.meeting;
            const EventIcon = Cfg.icon;
            return (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                <div className="flex-shrink-0 text-center w-12">
                  <p className="text-xs text-muted-foreground">{e.date.split(' ')[0]}</p>
                  <p className="text-lg font-bold text-foreground">{e.date.split(' ')[1]}</p>
                </div>
                <div className={`p-2 rounded-lg flex-shrink-0 ${Cfg.color}`}><EventIcon className="w-4 h-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{e.title}</p><p className="text-xs text-muted-foreground capitalize">{e.type}</p></div>
                {e.urgent && <span className="text-xs bg-warning/10 text-warning border border-warning/30 px-2 py-0.5 rounded-full">Urgent</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
