import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Builder from './pages/Builder';
import SavedRoutines from './pages/SavedRoutines';
import StoryboardPreview from './pages/StoryboardPreview';
import LibraryBuilder from './pages/LibraryBuilder';

function AppContent() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Always-mounted pages: show/hide via CSS to preserve state */}
        <div style={{ display: path === '/' ? 'block' : 'none' }}>
          <Builder />
        </div>
        <div style={{ display: path === '/library' ? 'block' : 'none' }}>
          <LibraryBuilder />
        </div>

        {/* Rarely-used pages: still use Routes (ok to remount) */}
        <Routes>
          <Route path="/saved" element={<SavedRoutines />} />
          <Route path="/storyboard-preview" element={<StoryboardPreview />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
