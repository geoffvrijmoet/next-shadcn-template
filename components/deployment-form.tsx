'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type DeploymentConfig, type DeploymentResult, type DeploymentProgress } from '@/lib/services/deployment-orchestrator';

export function DeploymentForm() {
  const [config, setConfig] = useState<Partial<DeploymentConfig>>({
    template: 'nextjs-shadcn',
    github: {
      token: '',
      username: '',
      private: false
    }
  });
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [progress, setProgress] = useState<DeploymentProgress[]>([]);
  const [activeTab, setActiveTab] = useState('project');

  const handleDeploy = async () => {
    if (!isValidConfig(config)) {
      alert('Please fill in all required fields');
      return;
    }

    setIsDeploying(true);
    setProgress([]);
    setDeploymentResult(null);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result: DeploymentResult = await response.json();
      
      if (!response.ok) {
        throw new Error((result as any).error || 'Deployment failed');
      }

      setDeploymentResult(result);
      setProgress(result.progress || []);
    } catch (error) {
      console.error('Deployment error:', error);
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const isValidConfig = (config: Partial<DeploymentConfig>): config is DeploymentConfig => {
    return !!(
      config.projectName &&
      config.description &&
      config.github?.token &&
      config.github?.username &&
      config.vercel?.token
    );
  };

  const completedSteps = progress.filter(p => p.status === 'completed').length;
  const totalSteps = progress.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-light mb-2">Deploy Your Web App</h1>
        <p className="text-gray-600">Configure and deploy a complete web application infrastructure</p>
      </div>

      {isDeploying && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment in Progress</CardTitle>
            <CardDescription>Your infrastructure is being created...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-4" />
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {progress.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' : 
                      step.status === 'error' ? 'destructive' : 
                      step.status === 'in-progress' ? 'secondary' : 'outline'
                    }
                  >
                    {step.status}
                  </Badge>
                  <span>{step.message}</span>
                  <span className="text-xs text-gray-500">
                    {step.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {deploymentResult && deploymentResult.success && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">🎉 Deployment Successful!</CardTitle>
            <CardDescription>Your web application has been deployed successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-medium">Live Application URL</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  value={deploymentResult.deployment.vercel.url} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={() => window.open(deploymentResult.deployment.vercel.url, '_blank')}
                  variant="outline"
                >
                  Open
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="font-medium">GitHub Repository</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  value={deploymentResult.repositories.github.url} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={() => window.open(deploymentResult.repositories.github.url, '_blank')}
                  variant="outline"
                >
                  View
                </Button>
              </div>
            </div>

            {deploymentResult.database?.mongodb && (
              <div>
                <Label className="font-medium">Database Connection String</Label>
                <Input 
                  value={deploymentResult.database.mongodb.connectionString} 
                  readOnly 
                  type="password"
                  className="mt-1"
                />
              </div>
            )}

            {deploymentResult.authentication?.clerk && (
              <div>
                <Label className="font-medium">Clerk Authentication</Label>
                <div className="space-y-2 mt-1">
                  <div>
                    <Label className="text-xs">Publishable Key</Label>
                    <Input 
                      value={deploymentResult.authentication.clerk.publishableKey} 
                      readOnly 
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Secret Key</Label>
                    <Input 
                      value={deploymentResult.authentication.clerk.secretKey} 
                      readOnly 
                      type="password"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="vercel">Vercel</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Configuration</CardTitle>
              <CardDescription>Basic project settings and template selection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={config.projectName || ''}
                  onChange={(e) => setConfig({...config, projectName: e.target.value})}
                  placeholder="my-awesome-app"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description || ''}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  placeholder="A brief description of your project"
                />
              </div>

              <div>
                <Label htmlFor="template">Template</Label>
                <Select 
                  value={config.template} 
                  onValueChange={(value: 'nextjs-shadcn' | 'nextjs-ecommerce' | 'nextjs-blog' | 'nextjs-saas') => setConfig({...config, template: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nextjs-shadcn">Next.js + shadcn/ui</SelectItem>
                    <SelectItem value="nextjs-ecommerce">E-commerce Store</SelectItem>
                    <SelectItem value="nextjs-blog">Blog/CMS</SelectItem>
                    <SelectItem value="nextjs-saas">SaaS Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="domain">Custom Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={config.domain || ''}
                  onChange={(e) => setConfig({...config, domain: e.target.value})}
                  placeholder="myapp.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Configuration</CardTitle>
              <CardDescription>Configure your GitHub repository settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="githubToken">GitHub Token</Label>
                <Input
                  id="githubToken"
                  type="password"
                  value={config.github?.token || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    github: {...config.github, token: e.target.value}
                  })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <Input
                  id="githubUsername"
                  value={config.github?.username || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    github: {...config.github, username: e.target.value}
                  })}
                  placeholder="yourusername"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={config.github?.private || false}
                  onCheckedChange={(checked) => setConfig({
                    ...config, 
                    github: {...config.github, private: !!checked}
                  })}
                />
                <Label htmlFor="private">Private Repository</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vercel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vercel Configuration</CardTitle>
              <CardDescription>Configure your Vercel deployment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vercelToken">Vercel Token</Label>
                <Input
                  id="vercelToken"
                  type="password"
                  value={config.vercel?.token || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    vercel: {...config.vercel, token: e.target.value}
                  })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="vercelTeamId">Team ID (Optional)</Label>
                <Input
                  id="vercelTeamId"
                  value={config.vercel?.teamId || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    vercel: {...config.vercel, teamId: e.target.value}
                  })}
                  placeholder="team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MongoDB Atlas (Optional)</CardTitle>
              <CardDescription>Configure your database cluster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mongoApiKey">API Key</Label>
                <Input
                  id="mongoApiKey"
                  type="password"
                  value={config.mongodb?.apiKey || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    mongodb: {...config.mongodb, apiKey: e.target.value}
                  })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="mongoPrivateKey">Private Key</Label>
                <Input
                  id="mongoPrivateKey"
                  type="password"
                  value={config.mongodb?.privateKey || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    mongodb: {...config.mongodb, privateKey: e.target.value}
                  })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="mongoOrgId">Organization ID</Label>
                <Input
                  id="mongoOrgId"
                  value={config.mongodb?.orgId || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    mongodb: {...config.mongodb, orgId: e.target.value}
                  })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mongoProvider">Provider</Label>
                  <Select 
                    value={config.mongodb?.provider} 
                    onValueChange={(value: any) => setConfig({
                      ...config, 
                      mongodb: {...config.mongodb, provider: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="GCP">Google Cloud</SelectItem>
                      <SelectItem value="AZURE">Azure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mongoRegion">Region</Label>
                  <Input
                    id="mongoRegion"
                    value={config.mongodb?.region || ''}
                    onChange={(e) => setConfig({
                      ...config, 
                      mongodb: {...config.mongodb, region: e.target.value}
                    })}
                    placeholder="us-east-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mongoTier">Tier</Label>
                <Select 
                  value={config.mongodb?.tier} 
                  onValueChange={(value: any) => setConfig({
                    ...config, 
                    mongodb: {...config.mongodb, tier: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M0">M0 (Free)</SelectItem>
                    <SelectItem value="M2">M2 (Shared)</SelectItem>
                    <SelectItem value="M5">M5 (Dedicated)</SelectItem>
                    <SelectItem value="M10">M10 (Dedicated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clerk Authentication (Optional)</CardTitle>
              <CardDescription>Configure user authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clerkSecretKey">Clerk Secret Key</Label>
                <Input
                  id="clerkSecretKey"
                  type="password"
                  value={config.clerk?.secretKey || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    clerk: {...config.clerk, secretKey: e.target.value}
                  })}
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying || !isValidConfig(config)}
          className="flex-1"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Application'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setConfig({
              template: 'nextjs-shadcn',
              github: { token: '', username: '', private: false }
            });
            setDeploymentResult(null);
            setProgress([]);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
} 