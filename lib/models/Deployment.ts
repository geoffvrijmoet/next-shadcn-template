export interface CreateAppRequest {
  projectName: string;
  description: string;
  template: string;
  githubRepo: string;
  domain?: string;
  features: string[];
}

export interface DeploymentStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
  url?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface DeploymentRecord {
  _id?: string;
  deploymentId: string;
  projectName: string;
  description: string;
  template: string;
  githubRepo: string;
  domain?: string;
  features: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  steps: DeploymentStep[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // URLs for created resources
  githubUrl?: string;
  vercelUrl?: string;
  mongodbConnectionString?: string;
  clerkApplicationId?: string;
  
  // Error tracking
  error?: string;
  errorStep?: string;
}

export interface ApiKeys {
  github: string;
  vercel: string;
  mongodb: string;
  clerk: string;
  googleCloud: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  repository: string;
  branch: string;
  dependencies: string[];
  requiredFeatures: string[];
  environmentVariables: string[];
}

export interface ServiceConfiguration {
  github: {
    repoName: string;
    description: string;
    private: boolean;
    template?: string;
  };
  vercel: {
    projectName: string;
    framework: string;
    buildCommand?: string;
    outputDirectory?: string;
    environmentVariables: Record<string, string>;
  };
  mongodb: {
    databaseName: string;
    clusterName: string;
    region: string;
  };
  clerk: {
    applicationName: string;
    domain?: string;
    features: string[];
  };
  googleCloud: {
    projectId: string;
    projectName: string;
    services: string[];
  };
} 