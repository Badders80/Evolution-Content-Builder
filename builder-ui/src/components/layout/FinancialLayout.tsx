import type { ReactNode } from 'react';
import { LayoutDashboard, FilePlus, BookOpen, Settings, LogOut } from 'lucide-react';

interface FinancialLayoutProps {
  children: ReactNode;
  activePage: 'dashboard' | 'builder' | 'assets';
  onNavigate: (page: string) => void;
}

export default function FinancialLayout({ children, activePage, onNavigate }: FinancialLayoutProps) {
  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => onNavigate(id)}
      className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        activePage === id 
          ? 'bg-fin-surface text-fin-primary' 
          : 'text-fin-muted hover:bg-fin-surface hover:text-fin-text'
      }`}
    >
      <Icon size={18} className={activePage === id ? 'text-fin-primary' : 'text-fin-muted group-hover:text-fin-text'} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-fin-surface text-fin-text font-sans">
      {/* Sidebar / Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-fin-border bg-fin-bg px-4 py-6 flex flex-col">
        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-fin-text text-evo-gold font-serif font-bold text-xl">
            E
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-fin-text">EVOLUTION</h1>
            <p className="text-[10px] font-medium text-fin-muted uppercase tracking-wider">Content Studio</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Portfolio Overview" />
          <div className="pt-4 pb-2">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-fin-muted">Create</p>
          </div>
          <NavItem id="builder" icon={FilePlus} label="New Update" />
          <NavItem id="research" icon={BookOpen} label="Research (RAG)" />
        </nav>

        {/* Footer Links */}
        <div className="border-t border-fin-border pt-4 mt-auto space-y-1">
          <NavItem id="settings" icon={Settings} label="Settings" />
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-fin-muted hover:text-fin-danger transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
