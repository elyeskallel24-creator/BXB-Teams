import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service or console
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60dvh] animate-enter">
          <div className="w-16 h-16 bg-state-dangerSoft text-state-danger rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight mb-2">Something went wrong</h1>
          <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark mb-6 max-w-md mx-auto leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-auto px-6"
          >
            <RotateCcw size={16} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

