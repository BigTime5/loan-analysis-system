import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ScrollToTop } from './components/ScrollToTop';
import CreditEngineLanding from './pages/CreditEngineLanding';
import SingleScore from './pages/SingleScore';
import BatchScore from './pages/BatchScore';
import ModelCard from './pages/ModelCard';
import './App.css';

// nothing needed here — GSAP & smoother only used on old landing

// App Layout for scoring pages (no ScrollSmoother)
function AppLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#05060f]">
      {/* App Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-[#05060f]/95 backdrop-blur-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#/" className="flex items-center gap-2">
              <span className="font-serif text-2xl tracking-wider text-[#e8f532]">CREDIT</span>
              <span className="font-script text-2xl text-white/80">Engine</span>
            </a>
            <div className="flex items-center gap-6">
              <a href="#/score" className="nav-link text-sm">Single Score</a>
              <a href="#/batch" className="nav-link text-sm">Batch Upload</a>
              <a href="#/model" className="nav-link text-sm">Model Card</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* App Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-wider text-[#e8f532]">CREDIT</span>
            <span className="font-script text-xl text-white/80">Engine</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#/score" className="hover:text-[#e8f532] transition-colors">Single Score</a>
            <a href="#/batch" className="hover:text-[#e8f532] transition-colors">Batch Upload</a>
            <a href="#/model" className="hover:text-[#e8f532] transition-colors">Model Card</a>
          </div>
          <div className="text-sm text-white/40">
            © 2025 CreditEngine
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}

// Main App
function AppContent() {
  return (
    <Routes>
      {/* Landing page — full-viewport iframe of creditengine.html */}
      <Route path="/" element={<CreditEngineLanding />} />

      {/* Scoring app pages */}
      <Route path="/score" element={
        <AppLayout>
          <SingleScore />
        </AppLayout>
      } />
      <Route path="/batch" element={
        <AppLayout>
          <BatchScore />
        </AppLayout>
      } />
      <Route path="/model" element={
        <AppLayout>
          <ModelCard />
        </AppLayout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
