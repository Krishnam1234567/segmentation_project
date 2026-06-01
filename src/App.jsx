import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AICopilot } from './components/AICopilot';
import { Dashboard } from './screens/Dashboard';
import { LegalDigitalTwin } from './screens/LegalDigitalTwin';
import { Contracts } from './screens/Contracts';
import { Compliance } from './screens/Compliance';
import { AIAgents } from './screens/AIAgents';
import { Placeholder } from './screens/Placeholder';
import { Scale, Globe, Users, GitBranch, BarChart3, Plug, Lock, Settings } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'digital-twin': return <LegalDigitalTwin />;
      case 'contracts': return <Contracts />;
      case 'compliance': return <Compliance />;
      case 'litigation': return <Placeholder title="Litigation Prediction" description="AI-powered litigation risk analysis and dispute prediction" icon={Scale} />;
      case 'expansion': return <Placeholder title="Global Expansion Simulator" description="Analyze legal requirements for international expansion" icon={Globe} />;
      case 'governance': return <Placeholder title="Governance & Board Management" description="Board resolutions, ESOP, and shareholder voting" icon={Users} />;
      case 'agents': return <AIAgents />;
      case 'knowledge': return <Placeholder title="Legal Knowledge Graph" description="Interactive legal relationship and dependency mapping" icon={GitBranch} />;
      case 'analytics': return <Placeholder title="Analytics & Executive Intelligence" description="Comprehensive legal KPIs and forecasting" icon={BarChart3} />;
      case 'integrations': return <Placeholder title="Enterprise Integrations" description="Connect with SAP, Salesforce, Workday, and more" icon={Plug} />;
      case 'security': return <Placeholder title="Security & AI Governance" description="Role management, audit logs, and AI safety controls" icon={Lock} />;
      case 'settings': return <Placeholder title="Settings & Admin Panel" description="Configure organization, billing, and preferences" icon={Settings} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onThemeToggle={() => setIsDarkMode(!isDarkMode)} isDark={isDarkMode} />
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>
      </div>
      <AICopilot />
    </div>
  );
}
