import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useInventoryStore } from '@/store';
import { getNavItemsForRole } from '@/config/permissions';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const currentUser = useInventoryStore((state) => state.currentUser);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const navItems = currentUser ? getNavItemsForRole(currentUser.role) : [];

  const filtered = React.useMemo(() => {
    if (!query) return navItems;
    const q = query.toLowerCase();
    return navItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [navItems, query]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl animate-scale-in overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-100 px-4">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 px-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No results found
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-emerald-50 transition-colors group"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 transition-colors shrink-0">
                  <item.icon className="h-4 w-4 text-slate-500 group-hover:text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Navigate to {item.name}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
