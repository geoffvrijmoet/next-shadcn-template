import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Link as LinkIcon, XCircle } from "lucide-react";

interface IntegrationStatusCardProps {
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error';
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function IntegrationStatusCard({
  name,
  description,
  status,
  onConnect,
  onDisconnect,
}: IntegrationStatusCardProps) {
  const renderStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          {renderStatusIcon()}
          <span>{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {status === 'connected' ? (
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect}>
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}