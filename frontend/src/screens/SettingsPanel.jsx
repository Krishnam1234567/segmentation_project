import { useState, useEffect } from 'react';
import { Settings, Building2, CreditCard, Bell, Palette, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const defaultSettings = {
  org: {
    name: 'Nexus Technologies Inc.',
    domain: 'nexustech.com',
    industry: 'Technology / SaaS',
    size: '201–500 employees',
    hq: 'San Francisco, CA, USA',
    gcName: 'Sarah Chen',
    gcEmail: 'sarah.chen@nexustech.com',
  },
  notifications: {
    deadline: true, risk: true, agent: true,
    compliance: false, report: true, billing: true,
  },
  appearance: {
    theme: 'dark', sidebarCompact: false,
    aiCopilotAutoOpen: true, denseTableView: false, animatedTransitions: true,
  },
};

const notificationDefs = [
  { id: 'deadline',   label: 'Deadline Reminders',  desc: 'Contract and compliance deadline alerts' },
  { id: 'risk',       label: 'Risk Alerts',          desc: 'High-risk events and threshold breaches' },
  { id: 'agent',      label: 'AI Agent Activity',    desc: 'Agent task completions and approvals needed' },
  { id: 'compliance', label: 'Compliance Updates',   desc: 'New regulatory changes affecting your business' },
  { id: 'report',     label: 'Weekly Reports',       desc: 'Legal operations summary every Monday' },
  { id: 'billing',    label: 'Billing Alerts',       desc: 'Invoice and renewal notifications' },
];

const appearanceDefs = [
  { id: 'sidebarCompact',      label: 'Sidebar Compact Mode',    desc: 'Collapse sidebar labels by default' },
  { id: 'aiCopilotAutoOpen',   label: 'AI Copilot Auto-Open',    desc: 'Show AI chat panel on startup' },
  { id: 'denseTableView',      label: 'Dense Table View',        desc: 'Show more rows with less padding' },
  { id: 'animatedTransitions', label: 'Animated Transitions',    desc: 'Enable smooth page transitions' },
];

const themeOptions = [
  { id: 'dark',   label: 'Dark Mode',      preview: '#0B1220' },
  { id: 'light',  label: 'Light Mode',     preview: '#F8FAFC' },
  { id: 'system', label: 'System Default', preview: 'linear-gradient(135deg, #0B1220 50%, #F8FAFC 50%)' },
];

const usageStats = [
  { label: 'Contracts Processed',   used: 1847,  limit: 5000,  color: 'bg-primary' },
  { label: 'AI Queries This Month', used: 4320,  limit: 10000, color: 'bg-accent' },
  { label: 'Storage Used',          used: 28,    limit: 100,   color: 'bg-purple-500', unit: 'GB' },
  { label: 'Active Users',          used: 18,    limit: 50,    color: 'bg-primary' },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('organization');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null

  // Load from localStorage first, then backend
  const stored = JSON.parse(localStorage.getItem('lexos_settings') || 'null');
  const [orgData, setOrgData]       = useState(stored?.org           || defaultSettings.org);
  const [notifications, setNotif]   = useState(stored?.notifications  || defaultSettings.notifications);
  const [appearance, setAppearance] = useState(stored?.appearance     || defaultSettings.appearance);

  useEffect(() => {
    fetch('/api/settings/')
      .then(r => r.json())
      .then(d => {
        if (d.org)           setOrgData(prev => ({ ...prev, ...d.org }));
        if (d.notifications) setNotif(prev => ({ ...prev, ...d.notifications }));
        if (d.appearance)    setAppearance(prev => ({ ...prev, ...d.appearance }));
      })
      .catch(() => {}); // Fall back to localStorage
  }, []);

  const saveSection = async (section, data) => {
    // Always save to localStorage immediately
    const current = JSON.parse(localStorage.getItem('lexos_settings') || '{}');
    current[section] = data;
    localStorage.setItem('lexos_settings', JSON.stringify(current));

    // Try backend
    try {
      await fetch('/api/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      });
    } catch (_) {}
  };

  const handleSave = async () => {
    setSaving(true); setSaveStatus(null);
    try {
      await Promise.all([
        saveSection('org', orgData),
        saveSection('notifications', notifications),
        saveSection('appearance', appearance),
      ]);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const tabs = [
    { id: 'organization',  label: 'Organization',  icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance',    label: 'Appearance',    icon: Palette },
    { id: 'billing',       label: 'Billing & Usage', icon: CreditCard },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Settings & Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Configure organization settings, billing, and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-60 ${
            saveStatus === 'saved' ? 'bg-accent text-white' :
            saveStatus === 'error' ? 'bg-destructive text-white' :
            'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
           saveStatus === 'saved' ? <CheckCircle className="w-4 h-4" /> :
           saveStatus === 'error' ? <AlertTriangle className="w-4 h-4" /> :
           <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error — retry' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <h3 className="text-base font-semibold text-foreground">Company Information</h3>
            {[
              { key: 'name',     label: 'Organization Name' },
              { key: 'domain',   label: 'Primary Domain' },
              { key: 'industry', label: 'Industry' },
              { key: 'size',     label: 'Company Size' },
              { key: 'hq',       label: 'Headquarters' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
                <input
                  value={orgData[key]}
                  onChange={e => setOrgData(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">General Counsel</h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Name</label>
                <input value={orgData.gcName} onChange={e => setOrgData(prev => ({ ...prev, gcName: e.target.value }))}
                  className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                <input value={orgData.gcEmail} onChange={e => setOrgData(prev => ({ ...prev, gcEmail: e.target.value }))}
                  className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Current Plan</h3>
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Enterprise</p>
                  <p className="text-xs text-muted-foreground">Annual — $48,000/yr</p>
                </div>
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Renewal</span>
                <span className="text-foreground font-medium">Jan 15, 2027</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {notificationDefs.map((n) => (
            <div key={n.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotif(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications[n.id] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[n.id] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Theme</h3>
            <div className="space-y-3">
              {themeOptions.map((t) => (
                <button key={t.id} onClick={() => setAppearance(prev => ({ ...prev, theme: t.id }))}
                  className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-all ${appearance.theme === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                  <div className="w-8 h-8 rounded-md border border-border flex-shrink-0" style={{ background: t.preview }} />
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  {appearance.theme === t.id && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Display Preferences</h3>
            <div className="space-y-4">
              {appearanceDefs.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-foreground">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <button
                    onClick={() => setAppearance(prev => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${appearance[pref.id] ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${appearance[pref.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Usage This Month</h3>
            <div className="space-y-5">
              {usageStats.map(({ label, used, limit, color, unit }) => {
                const pct = Math.round((used / limit) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{used.toLocaleString()}{unit || ''} / {limit.toLocaleString()}{unit || ''}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${color} ${pct > 80 ? 'animate-pulse' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-xs mt-1 ${pct > 80 ? 'text-warning' : 'text-muted-foreground'}`}>{pct}% used{pct > 80 ? ' — consider upgrading' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Billing Information</h3>
              <div className="space-y-3">
                {[
                  { label: 'Plan',           value: 'Enterprise Annual' },
                  { label: 'Amount',         value: '$48,000 / year' },
                  { label: 'Payment Method', value: '•••• •••• •••• 4287 (Visa)' },
                  { label: 'Next Invoice',   value: 'Jan 15, 2027' },
                  { label: 'Billing Contact',value: 'james.whitfield@nexustech.com' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors text-sm font-medium">
                Manage Billing
              </button>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">AI Query Usage at 43%</p>
                  <p className="text-xs text-muted-foreground mt-1">At current rate, projected to reach 78% by month end. Enterprise plan allows up to 10,000 AI queries/month.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
