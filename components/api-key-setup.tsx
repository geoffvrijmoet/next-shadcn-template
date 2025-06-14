'use client';

import { useState, useEffect } from 'react';
import { APIKeyManager, ServiceStatus } from '@/lib/config/api-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';

export function APIKeySetup() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [envTemplate, setEnvTemplate] = useState<string>('');
  const [showEnvTemplate, setShowEnvTemplate] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  useEffect(() => {
    const manager = new APIKeyManager();
    setServices(manager.getServiceStatuses());
    setEnvTemplate(manager.generateEnvTemplate());
  }, []);

  const requiredServices = services.filter(s => s.required);
  const optionalServices = services.filter(s => !s.required);
  const configuredRequired = requiredServices.filter(s => s.configured).length;
  const totalRequired = requiredServices.length;

  const copyEnvTemplate = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate);
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openServiceSetup = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">API Key Setup</h2>
        <p className="text-muted-foreground">
          Configure your API keys to enable all features of the Web App Generator
        </p>
        <div className="flex justify-center">
          <Badge variant={configuredRequired === totalRequired ? "default" : "secondary"}>
            {configuredRequired}/{totalRequired} Required Services Configured
          </Badge>
        </div>
      </div>

      {/* Progress Alert */}
      {configuredRequired < totalRequired && (
        <Alert>
          <AlertDescription>
            You need to configure {totalRequired - configuredRequired} more required service(s) to use the Web App Generator.
            The optional services can be added later to unlock additional features.
          </AlertDescription>
        </Alert>
      )}

      {/* Environment Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Environment Variables Template
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEnvTemplate(!showEnvTemplate)}
            >
              {showEnvTemplate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showEnvTemplate ? 'Hide' : 'Show'} Template
            </Button>
          </CardTitle>
        </CardHeader>
        {showEnvTemplate && (
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy this template to your <code>.env.local</code> file and fill in your actual API keys:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {envTemplate}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyEnvTemplate}
                >
                  <Copy className="w-4 h-4" />
                  {copiedEnv ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Required Services */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Required Services</h3>
        <div className="grid gap-4">
          {requiredServices.map((service) => (
            <ServiceCard key={service.name} service={service} onOpenSetup={openServiceSetup} />
          ))}
        </div>
      </div>

      {/* Optional Services */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Optional Services</h3>
        <p className="text-sm text-muted-foreground">
          These services unlock additional features but are not required to get started.
        </p>
        <div className="grid gap-4">
          {optionalServices.map((service) => (
            <ServiceCard key={service.name} service={service} onOpenSetup={openServiceSetup} />
          ))}
        </div>
      </div>

      {/* Next Steps */}
      {configuredRequired === totalRequired && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            🎉 All required services are configured! You can now use the Web App Generator.
            Consider setting up the optional services to unlock more features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: ServiceStatus;
  onOpenSetup: (url: string) => void;
}

function ServiceCard({ service, onOpenSetup }: ServiceCardProps) {
  return (
    <Card className={service.configured ? "border-green-200 bg-green-50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {service.configured ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {service.name}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={service.required ? "default" : "secondary"}>
              {service.required ? "Required" : "Optional"}
            </Badge>
            <Badge variant={service.configured ? "default" : "outline"}>
              {service.configured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variables */}
        <div>
          <h4 className="font-medium text-sm mb-2">Environment Variables:</h4>
          <div className="flex flex-wrap gap-1">
            {service.envVars.map((envVar) => (
              <code key={envVar} className="bg-muted px-2 py-1 rounded text-xs">
                {envVar}
              </code>
            ))}
          </div>
        </div>

        {/* Setup Instructions */}
        {!service.configured && (
          <div>
            <h4 className="font-medium text-sm mb-2">Setup Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              {service.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Button */}
        {!service.configured && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSetup(service.setupUrl)}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open {service.name} Setup
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 