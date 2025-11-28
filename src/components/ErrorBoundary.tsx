import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle proxy errors specifically
    if (error.message?.includes('disconnected port object')) {
      // Silently handle proxy errors without showing error UI
      this.setState({ hasError: false });
      return;
    }
  }

  public render() {
    if (this.state.hasError && !this.state.error?.message?.includes('disconnected port object')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-green-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* Error card */}
          <div className="relative z-10 max-w-md w-full mx-4">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-500/20 p-8 transform hover:scale-105 transition-transform duration-300">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4">
                    <svg 
                      className="w-12 h-12 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-4 text-center">
                Oops! Something Broke
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-center mb-2">
                Our chatbot encountered an unexpected error.
              </p>
              <p className="text-slate-400 text-sm text-center mb-8">
                Don't worry, a quick refresh should get things back on track!
              </p>

              {/* Error details (optional) */}
              {this.state.error && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-green-500/10">
                  <p className="text-xs text-slate-400 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Action button */}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transform active:scale-95"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  Refresh & Continue
                </span>
              </button>

              {/* Footer hint */}
              <p className="text-xs text-slate-500 text-center mt-6">
                Press <kbd className="px-2 py-1 bg-slate-700 rounded text-green-400">Ctrl+R</kbd> or the button above
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;