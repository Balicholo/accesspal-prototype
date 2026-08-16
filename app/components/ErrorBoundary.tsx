'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1016] px-6 text-center text-[#f3eee4]">
          <div>
            <h1 className="text-2xl font-semibold">AccessPal hit a snag</h1>
            <p className="mt-3 text-[#9aa3b2]">
              Refresh the page to continue the conversation.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
