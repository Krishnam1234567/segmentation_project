import { Search, Bell, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header({ onThemeToggle, isDark, session, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdown]   = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = session?.avatar || session?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const name  = session?.name || 'User';
  const role  = session?.role || 'Enterprise';

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts, entities, regulations... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-6">
        <button onClick={onThemeToggle} className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
          {isDark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
        </button>

        <button className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <Bell className="w-4 h-4 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdown(v => !v)}
            className="flex items-center gap-2 pl-3 pr-3 py-1.5 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-foreground leading-tight">{name}</div>
              <div className="text-xs text-muted-foreground">{role}</div>
            </div>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setDropdown(false); onLogout?.(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
