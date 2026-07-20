// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";

/** A child that throws on render to exercise the boundary. */
function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <span>ok</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeDefined();
  });

  it("renders the default fallback when a child throws", () => {
    // Silence the expected console.error noise from React's error logging.
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom message="kaboom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong.")).toBeDefined();
    expect(screen.getByText("kaboom")).toBeDefined();
    spy.mockRestore();
  });

  it("renders a custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={(err) => <div>custom: {String(err.message)}</div>}>
        <Boom message="custom-boom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("custom: custom-boom")).toBeDefined();
    spy.mockRestore();
  });
});
