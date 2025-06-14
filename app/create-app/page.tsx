'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import dynamic from 'next/dynamic';

const LogViewer = dynamic(() => import('@/components/LogViewer'), { ssr: false });

interface CreateAppForm {
  projectName: string;
  description: string;
  template: string;
  githubRepo: string;
  domain: string;
  targetCluster: string;
  features: string[];
}

export default function CreateAppPage() {
  const [form, setForm] = useState<CreateAppForm>({
    projectName: '',
    description: '',
    template: '',
    githubRepo: '',
    domain: '',
    targetCluster: '',
    features: []
  });

  const [githubRepoEdited, setGithubRepoEdited] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  const [cursorRules, setCursorRules] = useState<string[]>([]);
  const [isGeneratingRules, setIsGeneratingRules] = useState(false);

  // Base template is fixed to Next.js + shadcn/ui; user selects additional services below
  const baseTemplate = 'nextjs-shadcn';
  // ensure form template stays in sync
  useEffect(() => {
    setForm(prev => ({ ...prev, template: baseTemplate }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [clusterOptions, setClusterOptions] = useState<{ id: string; name: string }[]>([]);

  // Fetch cluster keys on mount
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await fetch('/api/clusters');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.clusters)) {
            setClusterOptions(data.clusters.map((key: string) => ({ id: key, name: key })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch clusters', err);
      }
    };
    fetchClusters();
  }, []);

  async function handleGenerateRules() {
    if (!form.description || form.description.trim().length < 20) {
      alert('Please provide a more detailed description (at least 20 characters)');
      return;
    }
    setIsGeneratingRules(true);
    try {
      const res = await fetch('/api/generate-cursor-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rules)) {
          setCursorRules(data.rules);
        }
      } else {
        console.error('Failed to generate rules');
      }
    } catch (error) {
      console.error('Failed to generate cursor rules', error);
    } finally {
      setIsGeneratingRules(false);
    }
  }

  type ServiceItem = { name: string; children?: string[] };

  const services: ServiceItem[] = [
    { name: 'Authentication (Clerk)' },
    { name: 'Database (MongoDB)' },
    { name: 'Payments (Stripe)' },
    { name: 'Email (Resend)' },
    { name: 'Image Storage (Cloudinary)' },
    { name: 'Video Streaming (Cloudflare)' },
    { name: 'E-commerce (Shopify)' },
    { name: 'Monitoring (Sentry)' },
    { name: 'Search (Algolia)' },
    {
      name: 'Google',
      children: [
        'Google Places API',
        'Google Sheets',
        'Google Calendar',
        'Gmail',
        'Google Ads',
        'Google Analytics'
      ]
    }
  ];

  const isChildSelected = (child: string) => form.features.includes(child);
  const areAllChildrenSelected = (children: string[]) => children.every(isChildSelected);

  const toggleParent = (parent: ServiceItem) => {
    if (!parent.children) return;
    const allSelected = areAllChildrenSelected(parent.children);
    const newFeatures = allSelected
      ? form.features.filter(f => !parent.children!.includes(f))
      : [...form.features, ...parent.children.filter((c: string) => !form.features.includes(c))];
    setForm(prev => ({ ...prev, features: newFeatures }));
  };

  const toggleChild = (child: string, parent?: ServiceItem) => {
    handleFeatureToggle(child);
    if (parent && parent.children) {
      // Update parent selection implicitly when needed (visual only)
      // Parent checkbox reflects through areAllChildrenSelected check in UI
    }
  };

  function handleFeatureToggle(feature: string) {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // submission starting
    
    try {
      const response = await fetch('/api/create-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start deployment');
      }
      
      const data = await response.json();
      setDeploymentId(data.deploymentId || 'simulate');
      
    } catch (error) {
      console.error('Deployment error:', error);
      // reset submission flag
    }
  };

  if (deploymentId) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-medium">Deployment Logs for {form.projectName}</h1>
        <LogViewer deploymentId={deploymentId} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light mb-2">Create New App</h1>
        <p className="text-gray-600">Generate a complete web application with all infrastructure in minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Basic information about your new application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={form.projectName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoRepo = name
                      .toLowerCase()
                      .trim()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9\-]/g, '');
                    setForm(prev => ({
                      ...prev,
                      projectName: name,
                      githubRepo: githubRepoEdited ? prev.githubRepo : autoRepo
                    }));
                  }}
                  placeholder="My Awesome App"
                  required
                />
              </div>
              <div>
                <Label htmlFor="githubRepo">GitHub Repository Name</Label>
                <Input
                  id="githubRepo"
                  value={form.githubRepo}
                  onChange={(e) => {
                    setGithubRepoEdited(true);
                    setForm(prev => ({ ...prev, githubRepo: e.target.value }));
                  }}
                  placeholder="my-awesome-app"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your app does..."
                required
              />
            </div>

            <div className="flex items-start gap-2">
              <Button
                type="button"
                onClick={handleGenerateRules}
                variant="secondary"
                disabled={isGeneratingRules}
              >
                {isGeneratingRules ? 'Generating…' : 'Generate Rules'}
              </Button>
              {cursorRules.length > 0 && (
                <span className="text-sm text-green-600">{cursorRules.length} rules generated</span>
              )}
            </div>

            {cursorRules.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 mt-2">
                {cursorRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            )}

            <div>
              <Label htmlFor="domain">Custom Domain (Optional)</Label>
              <Input
                id="domain"
                value={form.domain}
                onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="myapp.com"
              />
            </div>

            <div>
              <Label htmlFor="targetCluster">Target MongoDB Cluster</Label>
              <Select value={form.targetCluster} onValueChange={(value) => setForm(prev => ({ ...prev, targetCluster: value }))} disabled={clusterOptions.length === 0}>
                <SelectTrigger id="targetCluster">
                  <SelectValue placeholder="Select cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusterOptions.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose Services</CardTitle>
            <CardDescription>Select additional services & integrations for your app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map(service => (
                <div key={service.name}>
                  <label
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      service.children
                        ? areAllChildrenSelected(service.children)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        : form.features.includes(service.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={service.children ? areAllChildrenSelected(service.children) : form.features.includes(service.name)}
                      onChange={() => {
                        if (service.children) {
                          toggleParent(service);
                        } else {
                          handleFeatureToggle(service.name);
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      service.children
                        ? areAllChildrenSelected(service.children)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                        : form.features.includes(service.name)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                    }`}>
                      {(service.children ? areAllChildrenSelected(service.children) : form.features.includes(service.name)) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{service.name}</span>
                  </label>

                  {service.children && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 ml-6">
                      {service.children.map(child => (
                        <label
                          key={child}
                          className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                            form.features.includes(child)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.features.includes(child)}
                            onChange={() => toggleChild(child, service)}
                            className="sr-only"
                          />
                          <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                            form.features.includes(child)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {form.features.includes(child) && (
                              <CheckCircle className="w-2 h-2 text-white" />
                            )}
                          </div>
                          <span>{child}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!form.projectName || !form.githubRepo || !form.targetCluster}
            className="min-w-[200px]"
          >
            🚀 Create App
          </Button>
        </div>
      </form>
    </div>
  );
} 