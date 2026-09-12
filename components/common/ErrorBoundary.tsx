'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  title?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  resetKey?: string | number;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
  prevResetKey?: string | number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
      prevResetKey: props.resetKey,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    if (nextProps.resetKey !== undefined && nextProps.resetKey !== prevState.prevResetKey) {
      return {
        hasError: false,
        error: null,
        showDetails: false,
        prevResetKey: nextProps.resetKey,
      };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const title = this.props.title || 'Something went wrong in this section';
      const fallbackMessage =
        this.props.fallbackMessage ||
        'An unexpected error occurred while rendering this module. You can reload this component to continue safely.';

      return (
        <div
          id="error-boundary-card"
          className="rounded-2xl border border-red-200 bg-red-50/50 p-6 my-4 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="error-boundary-title" className="text-base font-semibold text-gray-900">
                {title}
              </h3>
              <p id="error-boundary-description" className="mt-1 text-sm text-gray-600 leading-relaxed">
                {fallbackMessage}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  id="error-boundary-reset-btn"
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try Again
                </button>

                <button
                  id="error-boundary-toggle-details-btn"
                  type="button"
                  onClick={this.toggleDetails}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>{this.state.showDetails ? 'Hide Error Details' : 'View Error Details'}</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  )}
                </button>
              </div>

              {this.state.showDetails && this.state.error && (
                <div
                  id="error-boundary-details-panel"
                  className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-xs text-red-800 font-mono overflow-x-auto max-h-48"
                >
                  <p className="font-semibold text-red-900 mb-1">{this.state.error.name}:</p>
                  <p>{this.state.error.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
