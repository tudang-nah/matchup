import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// ---- ERROR BOUNDARY ----
// Catches any React render errors and shows a user-friendly fallback
// instead of a blank white page.
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary] Caught error:", error, info);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "sans-serif",
            background: "#0f172a",
            color: "#f8fafc",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "3rem" }}>⚽</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            MatchUp
          </h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            Có lỗi xảy ra, vui lòng tải lại trang.
          </p>
          {this.state.message && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                background: "#1e293b",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                maxWidth: "480px",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {this.state.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              marginTop: "0.5rem",
              padding: "0.625rem 2rem",
              borderRadius: "9999px",
              border: "none",
              background:
                "linear-gradient(135deg, oklch(0.58 0.18 220), oklch(0.70 0.20 138))",
              color: "white",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent unhandled promise errors from crashing the render tree
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </AppErrorBoundary>,
);
