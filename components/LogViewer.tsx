import { useEffect, useState } from 'react';

interface LogViewerProps {
  deploymentId: string;
}

export default function LogViewer({ deploymentId }: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!deploymentId) return;
    const ev = new EventSource(`/api/deployments/${deploymentId}/stream`);
    ev.onmessage = (e) => {
      if (e.data === '__COMPLETE__') {
        setComplete(true);
        ev.close();
      } else {
        setLogs((prev) => [...prev, e.data]);
      }
    };
    ev.onerror = () => {
      ev.close();
    };
    return () => ev.close();
  }, [deploymentId]);

  return (
    <div className="border rounded-md p-4 bg-gray-50 h-64 overflow-auto text-sm font-mono">
      {logs.map((l, idx) => (
        <div key={idx}>{l}</div>
      ))}
      {complete && <div className="text-green-600">--- Deployment complete ---</div>}
    </div>
  );
} 