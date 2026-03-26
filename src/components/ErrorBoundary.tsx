import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let firestoreError = null;

      try {
        if (this.state.error?.message) {
          firestoreError = JSON.parse(this.state.error.message);
          if (firestoreError.error && firestoreError.error.includes('Missing or insufficient permissions')) {
            errorMessage = `Permission Denied: You don't have access to ${firestoreError.path || 'this data'}. Please contact your administrator.`;
          }
        }
      } catch (e) {
        // Not a JSON error message, use default
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-2xl border border-red-100">
          <div className="bg-red-100 p-4 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            <RefreshCw className="w-5 h-5" />
            Reload Application
          </button>
          
          {firestoreError && (
            <div className="mt-8 p-4 bg-white/50 rounded-lg text-left w-full max-w-lg overflow-auto">
              <p className="text-xs font-mono text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(firestoreError, null, 2)}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
