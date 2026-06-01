import { useState } from 'react';
import { Eye, EyeOff, Scale, Loader2, Shield, Zap, GitBranch } from 'lucide-react';

const DEMO_USERS = [
  { email: 'sarah.chen@demo.lexos.app',    password: 'demo', name: 'Sarah Chen',     role: 'General Counsel',      avatar: 'SC' },
  { email: 'marcus.okafor@demo.lexos.app', password: 'demo', name: 'Marcus Okafor',  role: 'Senior Legal Counsel', avatar: 'MO' },
  { email: 'admin@demo.lexos.app',         password: 'demo', name: 'Admin',           role: 'System Administrator', avatar: 'AD' },
];

const FEATURES = [
  { icon: Zap,       text: 'AI-powered legal intelligence with Gemini' },
  { icon: Shield,    text: '14 compliance frameworks monitored' },
  { icon: GitBranch, text: 'Interactive legal knowledge graph' },
  { icon: Scale,     text: 'Real-time litigation risk assessment' },
];

export function Login({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900)); // UX delay

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const session = { ...user, loginAt: Date.now() };
      localStorage.setItem('lexos_session', JSON.stringify(session));
      onLogin(session);
    } else {
      setError('Invalid credentials. Try sarah.chen@demo.lexos.app / demo');
    }
    setLoading(false);
  };

  const quickLogin = (user) => {
    setEmail(user.email);
    setPass(user.password);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tracking-tight">LexOS</p>
              <p className="text-xs text-muted-foreground">Legal Operating System</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight mb-6">
            The AI-powered<br />
            <span className="text-primary">legal intelligence</span><br />
            platform for enterprises.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-12">
            Manage contracts, litigation, compliance, and global expansion — all powered by Gemini AI and real-time legal intelligence.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl">
            <Shield className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-xs text-muted-foreground">SOC 2 Type II certified · GDPR compliant · 256-bit encryption</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">LexOS</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your LexOS workspace</p>
          </div>

          {/* Quick login */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Quick demo access</p>
            <div className="flex gap-2">
              {DEMO_USERS.map(u => (
                <button key={u.email} onClick={() => quickLogin(u)}
                  className="flex-1 flex flex-col items-center gap-1 p-2 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                  <div className="w-7 h-7 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">{u.avatar}</div>
                  <span className="text-xs text-muted-foreground leading-tight">{u.role.split(' ')[0]}<br/>{u.role.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah.chen@demo.lexos.app"
                required
                className="w-full px-3 py-2.5 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/50 pr-10"
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In to LexOS'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground text-center"><span className="font-medium text-foreground">Demo credentials:</span> sarah.chen@demo.lexos.app / demo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
