import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Builder from './pages/Builder';
import SavedRoutines from './pages/SavedRoutines';
import StoryboardPreview from './pages/StoryboardPreview';
import LibraryBuilder from './pages/LibraryBuilder';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Builder />} />
            <Route path="/saved" element={<SavedRoutines />} />
            <Route path="/storyboard-preview" element={<StoryboardPreview />} />
            <Route path="/library" element={<LibraryBuilder />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
