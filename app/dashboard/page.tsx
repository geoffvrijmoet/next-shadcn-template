'use client';

import { useState } from "react";
import IntegrationStatusCard from "@/components/IntegrationStatusCard";
import GapTable from "@/components/GapTable";
import PolicyGenerator from "@/components/PolicyGenerator";

export default function DashboardPage() {
  const [integrations, setIntegrations] = useState([
    {
      name: 'GitHub',
      description: 'Source code hosting',
      status: 'disconnected' as const,
    },
    {
      name: 'AWS',
      description: 'Cloud infrastructure',
      status: 'disconnected' as const,
    },
    {
      name: 'Google Workspace',
      description: 'Email & identity',
      status: 'connected' as const,
    },
  ]);

  const handleConnect = (name: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.name === name ? { ...i, status: 'connected' } : i))
    );
  };

  const handleDisconnect = (name: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.name === name ? { ...i, status: 'disconnected' } : i))
    );
  };

  const gaps = [
    {
      id: '1',
      control: 'CC6.1',
      description: 'Multi-factor authentication not enforced for AWS root user.',
      severity: 'High' as const,
    },
    {
      id: '2',
      control: 'CC1.3',
      description: 'No documented change management policy.',
      severity: 'Medium' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Compliance Dashboard</h1>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <IntegrationStatusCard
            key={integration.name}
            name={integration.name}
            description={integration.description}
            status={integration.status}
            onConnect={() => handleConnect(integration.name)}
            onDisconnect={() => handleDisconnect(integration.name)}
          />
        ))}
      </div>

      {/* Gaps and Policy Generator */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <GapTable gaps={gaps} />
        <PolicyGenerator />
      </div>
    </div>
  );
}