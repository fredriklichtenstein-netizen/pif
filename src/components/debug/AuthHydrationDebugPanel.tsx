import { useEffect, useState } from "react";
import {
  getDebugEntries,
  isDebugEnabled,
  subscribeDebug,
  clearDebug,
  type DebugEntry,
} from "@/utils/authDebug";

// Floating debug panel. Only renders when ?debug=1 or localStorage.pif_debug=1.
// Shows auth hydration + messages/notifications fetch timeline. Collapsible.
export function AuthHydrationDebugPanel() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(true);
  const [enabled] = useState(() => isDebugEnabled());

  useEffect(() => {
    if (!enabled) return;
    return subscribeDebug(() => force((n) => n + 1));
  }, [enabled]);

  if (!enabled) return null;

  const entries: DebugEntry[] = getDebugEntries();

  const scopeColor = (scope: string): string => {
    if (scope === "auth") return "#60a5fa";
    if (scope === "notifications") return "#f59e0b";
    if (scope === "conversations") return "#10b981";
    return "#a3a3a3";
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 99999,
        width: open ? 380 : 140,
        maxHeight: open ? "55vh" : 32,
        background: "rgba(15,23,42,0.95)",
        color: "#e5e7eb",
        font: "11px/1.35 ui-monospace,Menlo,monospace",
        border: "1px solid #334155",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px",
          background: "#1e293b",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ fontWeight: 600 }}>
          🛠 Debug ({entries.length})
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          {open && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const lines = [
                    `PIF Debug Report`,
                    `Generated: ${new Date().toISOString()}`,
                    `URL: ${window.location.href}`,
                    `UA: ${navigator.userAgent}`,
                    `Entries: ${entries.length}`,
                    ``,
                    ...entries.map((e) => {
                      let dataStr = "";
                      if (e.data !== undefined && e.data !== null && e.data !== "") {
                        try {
                          dataStr = " " + (typeof e.data === "string" ? e.data : JSON.stringify(e.data));
                        } catch {
                          dataStr = " " + String(e.data);
                        }
                      }
                      return `[${String(e.t).padStart(6, " ")}ms][${e.scope}] ${e.msg}${dataStr}`;
                    }),
                  ];
                  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `pif-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: 0,
                  borderRadius: 4,
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                export
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); clearDebug(); }}
                style={{
                  background: "#334155",
                  color: "#e5e7eb",
                  border: 0,
                  borderRadius: 4,
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                clear
              </button>
            </>
          )}
          <span>{open ? "▾" : "▸"}</span>
        </span>
      </div>
      {open && (
        <div style={{ overflowY: "auto", maxHeight: "calc(55vh - 32px)", padding: 6 }}>
          {entries.length === 0 ? (
            <div style={{ color: "#64748b", padding: 4 }}>No events yet…</div>
          ) : (
            entries.map((e, i) => (
              <div key={i} style={{ padding: "2px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ color: "#64748b" }}>{String(e.t).padStart(5, " ")}ms </span>
                <span style={{ color: scopeColor(e.scope), fontWeight: 600 }}>
                  [{e.scope}]
                </span>{" "}
                <span>{e.msg}</span>
                {e.data !== undefined && e.data !== null && e.data !== "" && (
                  <div style={{ color: "#94a3b8", paddingLeft: 12 }}>
                    {(() => {
                      try {
                        const s = typeof e.data === "string"
                          ? e.data
                          : JSON.stringify(e.data);
                        return s.length > 200 ? s.slice(0, 200) + "…" : s;
                      } catch {
                        return String(e.data);
                      }
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
