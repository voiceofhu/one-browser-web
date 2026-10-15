import { Component, type ErrorInfo, type ReactNode } from 'react';

import ErrorPage from './error-page';

type AppErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string;
  embedded?: boolean;
};

type AppErrorBoundaryState = {
  error: Error | null;
  resetKey?: string;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromProps(
    props: AppErrorBoundaryProps,
    state: AppErrorBoundaryState,
  ): AppErrorBoundaryState | null {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }

    return null;
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('One Browser Web render failed.', error, info);
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
