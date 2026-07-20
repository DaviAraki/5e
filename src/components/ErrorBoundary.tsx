import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Catches render-time errors in its subtree and shows a recovery UI instead of
 * a blank page. Wrap any subtree that renders third-party-shaped data (entity
 * stat blocks, the recursive EntryRenderer, etc.) so one malformed record
 * doesn't take down the whole route.
 *
 * Class component because React still requires `componentDidCatch` /
 * `getDerivedStateFromError` — there is no hooks API for error boundaries.
 */
interface Props {
  children: ReactNode;
  /** Optional custom fallback. Receives the caught error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // surface to the dev console with the component stack for debugging; no
    // telemetry shipped (the app has no analytics backend).
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-base font-semibold text-fg">Something went wrong.</p>
          <p className="max-w-md text-sm text-fg-muted">
            {String(this.state.error.message)}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-bg-raised"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
