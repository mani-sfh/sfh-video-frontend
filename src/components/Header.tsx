import { Link, useLocation } from 'react-router-dom';
import { Film, Library, Code } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  return (
    <header className="bg-gradient-to-r from-navy to-crimson px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-white no-underline">
          <Film className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold tracking-wide m-0">
              SENIOR FITNESS <span className="text-pink-200">HUB</span>
            </h1>
            <p className="text-xs text-white/70 font-quicksand m-0">
              Routine Video Builder
            </p>
          </div>
        </Link>
        <nav className="flex gap-2">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold no-underline transition-all ${
              location.pathname === '/'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Film className="w-4 h-4" />
            Builder
          </Link>
          <Link
            to="/codes"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold no-underline transition-all ${
              location.pathname === '/codes'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Code className="w-4 h-4" />
            Codes
          </Link>
          <Link
            to="/library"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold no-underline transition-all ${
              location.pathname === '/library'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Library className="w-4 h-4" />
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
