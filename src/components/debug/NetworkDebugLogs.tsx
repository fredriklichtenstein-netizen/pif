
interface NetworkDebugLogsProps {
  logs: string[];
}

export function NetworkDebugLogs({ logs }: NetworkDebugLogsProps) {
  return (
    <div className="h-[300px] overflow-auto bg-gray-50 p-2 rounded text-xs font-mono">
      {logs.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No logs yet. Run a test to see results.</div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))
      )}
    </div>
  );
}
