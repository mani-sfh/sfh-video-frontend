import { BrowserRouter, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Builder from './pages/Builder';
import SavedCodes from './pages/SavedCodes';
import StoryboardPreview from './pages/StoryboardPreview';
import LibraryBuilder from './pages/LibraryBuilder';

function AppContent() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div style={{ display: path === '/' ? 'block' : 'none' }}>
          <Builder />
        </div>
        <div style={{ display: path === '/library' ? 'block' : 'none' }}>
          <LibraryBuilder />
        </div>
        <div style={{ display: path === '/codes' ? 'block' : 'none' }}>
          <SavedCodes />
        </div>
        {path === '/storyboard-preview' && <StoryboardPreview />}
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
