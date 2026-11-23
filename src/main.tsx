import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected runtime error' };
  }

  handleReset = () => {
    try {
      localStorage.removeItem('bataan_laban_korapsyon_v2');
      localStorage.removeItem('bataan_laban_korapsyon_v1');
    } catch {
      // Ignore storage restrictions
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#132334] p-6 text-[#F1F6FA]">
          <div className="w-full max-w-md border-2 border-[#7FA4BE] bg-[#1D3549] p-6 text-center shadow-2xl">
            <h1 className="font-display text-xl font-bold text-[#F4C542]">Bataan: Laban sa Korapsyon</h1>
            <p className="mt-2 text-sm text-[#D6E6F2]">
              Nagkaroon ng problema habang naglo-load ang laro.
            </p>
            <p className="mt-2 border border-[#3C5E77] bg-[#122334] p-2 font-mono text-xs text-[#9BC0D9]">
              {this.state.message}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cursor-pointer border-2 border-[#7FA4BE] bg-[#2B4861] px-4 py-2 font-display text-xs font-bold text-white hover:bg-[#365A78]"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="cursor-pointer border-2 border-[#FFF0B3] bg-[#F4C542] px-4 py-2 font-display text-xs font-bold text-[#102030] hover:bg-[#FFD45C]"
              >
                Reset Save &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
