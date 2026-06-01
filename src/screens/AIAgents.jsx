import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings as SettingsIcon, Activity, CheckCircle, Clock } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

export function AIAgents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromAPI('/agents')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading AI agents data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load AI agents data</div>;

  // Data fetched from API

  return (
    <div className="p-6 space-y-6">
      <div><h2 className="text-2xl font-semibold text-foreground mb-1">AI Legal Agents Hub</h2><p className="text-sm text-muted-foreground">Autonomous agents managing legal operations</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Active Agents</p><Bot className="w-4 h-4 text-accent" /></div><p className="text-2xl font-semibold text-foreground">{data.active_agents}</p><p className="text-xs text-accent mt-1">of {data.total_agents} total</p></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Tasks Completed</p><CheckCircle className="w-4 h-4 text-primary" /></div><p className="text-2xl font-semibold text-foreground">{data.tasks_completed_month.toLocaleString()}</p><p className="text-xs text-primary mt-1">This month</p></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Pending Approval</p><Clock className="w-4 h-4 text-warning" /></div><p className="text-2xl font-semibold text-foreground">{data.pending_approval}</p><p className="text-xs text-warning mt-1">Requires review</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.agents.map((agent) => (
          <div key={agent.id} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-accent/10' : 'bg-muted'}`}><Bot className={`w-5 h-5 ${agent.status === 'active' ? 'text-accent' : 'text-muted-foreground'}`} /></div>
                <div><h3 className="font-semibold text-foreground">{agent.name}</h3><p className="text-xs text-muted-foreground">{agent.lastAction}</p></div>
              </div>
              <button className="p-1.5 hover:bg-muted rounded transition-colors"><SettingsIcon className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Status</span><span className={`font-medium ${agent.status === 'active' ? 'text-accent' : 'text-muted-foreground'}`}>{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Tasks Completed</span><span className="font-medium text-foreground">{agent.tasksCompleted}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Confidence</span><span className="font-medium text-foreground">{agent.confidence}%</span></div>
            </div>
            <div className="flex gap-2">
              {agent.status === 'active' ? (
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"><Pause className="w-4 h-4" />Pause</button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"><Play className="w-4 h-4" />Activate</button>
              )}
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm"><Activity className="w-4 h-4" />Logs</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Human Approval Queue</h3>
          <div className="space-y-4">{data.approval_queue.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between mb-3"><div><p className="font-medium text-foreground mb-1">{item.task}</p><p className="text-xs text-muted-foreground">{item.agent}</p></div><span className={`text-xs font-medium px-2 py-1 rounded ${item.impact === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{item.impact} Impact</span></div>
              <div className="bg-muted/30 rounded p-3 mb-3"><p className="text-xs text-muted-foreground mb-1">AI Reasoning:</p><p className="text-sm text-foreground">{item.reasoning}</p></div>
              <div className="flex items-center justify-between mb-3"><span className="text-sm text-muted-foreground">Confidence Score</span><span className="text-sm font-semibold text-foreground">{item.confidence}%</span></div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">Approve</button>
                <button className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">Reject</button>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm font-medium">Details</button>
              </div>
            </div>
          ))}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Agent Activity</h3>
          <div className="space-y-3">{data.recent_activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${a.type === 'alert' ? 'bg-warning' : a.type === 'success' ? 'bg-accent' : 'bg-primary'}`} />
              <div className="flex-1"><p className="text-sm font-medium text-foreground">{a.agent}</p><p className="text-sm text-muted-foreground mt-1">{a.action}</p><p className="text-xs text-muted-foreground mt-1">{a.timestamp}</p></div>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}
