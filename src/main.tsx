import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";
import "./App.css";

console.log("Roast: Application starting...");

window.onerror = function(msg, _url, lineNo, columnNo, error) {
  const errStr = `JS Error: ${msg} at ${lineNo}:${columnNo}\n${error?.stack || ""}`;
  console.error(errStr);
  invoke("log_to_file", { msg: errStr }).catch(() => {});
  alert(errStr); // Immediate visible alert for early crashes
  return false;
};

window.onunhandledrejection = function(event) {
  const errStr = `Unhandled Promise: ${event.reason}`;
  console.error(errStr);
  alert(errStr);
};

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  ReactDOM.createRoot(rootElement as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error: any) {
  console.error("Roast: Fatal crash during initialization", error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #900; font-family: sans-serif;">
      <h1 style="margin: 0 0 10px 0;">Fatal Error</h1>
      <pre style="white-space: pre-wrap;">${error?.stack || error?.message || error}</pre>
      <p>アプリケーションの起動に失敗しました。この画面が表示されている場合は、フロントエンド（React）側でエラーが発生しています。</p>
    </div>
  `;
}
