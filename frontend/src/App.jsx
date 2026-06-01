import { useState, useEffect } from 'react';
import { Sidebar }         from './components/Sidebar';
import { Header }          from './components/Header';
import { AICopilot }       from './components/AICopilot';
import { Login }           from './screens/Login';
import { Dashboard }       from './screens/Dashboard';
import { LegalDigitalTwin }from './screens/LegalDigitalTwin';
import { Contracts }       from './screens/Contracts';
import { Compliance }      from './screens/Compliance';
import { AIAgents }        from './screens/AIAgents';
import { Litigation }      from './screens/Litigation';
import { GlobalExpansion } from './screens/GlobalExpansion';
import { Governance }      from './screens/Governance';
import { KnowledgeGraph }  from './screens/KnowledgeGraph';
import { Analytics }       from './screens/Analytics';
import { Integrations }    from './screens/Integrations';
import { Security }        from './screens/SecurityGovernance';
import { SettingsPanel }   from './screens/SettingsPanel';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isDarkMode, setIsDarkMode]     = useState(true);
  const [session, setSession]           = useState(null);
  const [authChecked, setAuthChecked]   = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lexos_session');
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch (_) {}
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleLogin  = (s) => setSession(s);
  const handleLogout = () => {
    localStorage.removeItem('lexos_session');
    setSession(null);
    setActiveScreen('dashboard');
  };

  // Splash while checking auth
  if (!authChecked) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">L</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading LexOS…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':    return <Dashboard />;
      case 'digital-twin': return <LegalDigitalTwin />;
      case 'contracts':    return <Contracts />;
      case 'compliance':   return <Compliance />;
      case 'litigation':   return <Litigation />;
      case 'expansion':    return <GlobalExpansion />;
      case 'governance':   return <Governance />;
      case 'agents':       return <AIAgents />;
      case 'knowledge':    return <KnowledgeGraph />;
      case 'analytics':    return <Analytics />;
      case 'integrations': return <Integrations />;
      case 'security':     return <Security />;
      case 'settings':     return <SettingsPanel />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          isDark={isDarkMode}
          session={session}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>
      </div>
      <AICopilot />
    </div>
  );
}
