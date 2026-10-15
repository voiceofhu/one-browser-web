import { Component, type ErrorInfo, type ReactNode } from 'react';

import ErrorPage from './error-page';

type AppErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string;
  embedded?: boolean;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('One Browser Web render failed.', error, info);
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPage
          error={this.state.error}
          reset={() => this.setState({ error: null })}
          embedded={this.props.embedded}
        />
      );
    }

    return this.props.children;
  }
}
