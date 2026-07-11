import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React lifecycle:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-neutral-150 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight mb-2">
              Algo deu errado
            </h2>
            
            <p className="text-neutral-500 text-xs leading-relaxed mb-6 font-semibold">
              Ocorreu uma falha inesperada na renderização de tela. Isso pode ser devido a uma falha temporária de rede ou de sincronização.
            </p>

            {this.state.error && (
              <div className="text-left bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6 max-h-[120px] overflow-y-auto font-mono text-[9px] text-neutral-600 leading-normal">
                <span className="text-rose-600 font-bold block mb-1">
                  Erro: {this.state.error.name}
                </span>
                {this.state.error.message}
                {this.state.error.stack && (
                  <span className="block text-neutral-400 mt-1">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 border border-emerald-550"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar Sistema</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

