import React from "react";
import ReactDOM from "react-dom/client";
import WC2026Predictor from "../wc2026-predictor.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  handleReset = () => {
    try {
      localStorage.removeItem("wc2026:injects:v1");
    } catch {}
    window.location.href = window.location.pathname;
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a3d3a", color: "#faf7f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", padding: "24px" }}>
          <div style={{ maxWidth: "440px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <h1 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontWeight: 400, fontSize: "26px", margin: "0 0 10px" }}>Something went wrong</h1>
            <p style={{ color: "#A1E4DB", fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px" }}>
              The predictor hit an unexpected error. Resetting your saved results usually fixes it.
            </p>
            <button onClick={this.handleReset} style={{ background: "#ff6b47", color: "#fff", border: "none", borderRadius: "9999px", padding: "10px 22px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              Reset & reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WC2026Predictor />
    </ErrorBoundary>
  </React.StrictMode>
);
