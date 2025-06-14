import { GitHubService, type GitHubConfig } from './github';
import { VercelService, type VercelConfig } from './vercel';
import { MongoDBService, type MongoDBConfig } from './mongodb';
import { ClerkService, type ClerkConfig } from './clerk';

export interface DeploymentConfig {
  // Project details
  projectName: string;
  description: string;
  template: 'nextjs-shadcn' | 'nextjs-ecommerce' | 'nextjs-blog' | 'nextjs-saas';
  
  // GitHub configuration
  github: {
    token: string;
    username: string;
    private: boolean;
  };
  
  // Vercel configuration
  vercel: {
    token: string;
    teamId?: string;
  };
  
  // MongoDB configuration (optional)
  mongodb?: {
    apiKey: string;
    privateKey: string;
    orgId: string;
    region: string;
    tier: string;
    provider: 'AWS' | 'GCP' | 'AZURE';
  };
  
  // Clerk configuration (optional)
  clerk?: {
    secretKey: string;
  };
  
  // Custom domain (optional)
  domain?: string;
}

export interface DeploymentProgress {
  step: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface DeploymentResult {
  success: boolean;
  projectId: string;
  repositories: {
    github: {
      url: string;
      cloneUrl: string;
    };
  };
  deployment: {
    vercel: {
      url: string;
      projectId: string;
      deploymentId: string;
    };
  };
  database?: {
    mongodb: {
      connectionString: string;
      clusterId: string;
    };
  };
  authentication?: {
    clerk: {
      applicationId: string;
      publishableKey: string;
      secretKey: string;
    };
  };
  environmentVariables: Record<string, string>;
  progress: DeploymentProgress[];
}

export class DeploymentOrchestrator {
  private progress: DeploymentProgress[] = [];
  private onProgressUpdate?: (progress: DeploymentProgress[]) => void;

  constructor(onProgressUpdate?: (progress: DeploymentProgress[]) => void) {
    this.onProgressUpdate = onProgressUpdate;
  }

  /**
   * Deploy a complete web application infrastructure
   */
  async deployApplication(config: DeploymentConfig): Promise<DeploymentResult> {
    const result: DeploymentResult = {
      success: false,
      projectId: this.generateProjectId(config.projectName),
      repositories: {
        github: { url: '', cloneUrl: '' }
      },
      deployment: {
        vercel: { url: '', projectId: '', deploymentId: '' }
      },
      environmentVariables: {},
      progress: []
    };

    try {
      // Step 1: Create GitHub repository
      await this.updateProgress('github-repo', 'in-progress', 'Creating GitHub repository...');
      const githubRepo = await this.createGitHubRepository(config);
      result.repositories.github = {
        url: githubRepo.htmlUrl,
        cloneUrl: githubRepo.cloneUrl
      };
      await this.updateProgress('github-repo', 'completed', 'GitHub repository created successfully');

      // Step 2: Generate template files
      await this.updateProgress('template-files', 'in-progress', 'Generating template files...');
      await this.generateTemplateFiles(config, githubRepo.name);
      await this.updateProgress('template-files', 'completed', 'Template files generated successfully');

      // Step 3: Create MongoDB cluster (if configured)
      if (config.mongodb) {
        await this.updateProgress('mongodb-setup', 'in-progress', 'Creating MongoDB cluster...');
        const mongoResult = await this.createMongoDBCluster(config);
        result.database = { mongodb: mongoResult };
        await this.updateProgress('mongodb-setup', 'completed', 'MongoDB cluster created successfully');
      }

      // Step 4: Create Clerk application (if configured)
      if (config.clerk) {
        await this.updateProgress('clerk-setup', 'in-progress', 'Setting up Clerk authentication...');
        const clerkResult = await this.createClerkApplication(config);
        result.authentication = { clerk: clerkResult };
        await this.updateProgress('clerk-setup', 'completed', 'Clerk authentication configured successfully');
      }

      // Step 5: Prepare environment variables
      result.environmentVariables = this.generateEnvironmentVariables(result, config);

      // Step 6: Create Vercel project
      await this.updateProgress('vercel-project', 'in-progress', 'Creating Vercel project...');
      const vercelProject = await this.createVercelProject(config, result.environmentVariables);
      result.deployment.vercel.projectId = vercelProject.id;
      await this.updateProgress('vercel-project', 'completed', 'Vercel project created successfully');

      // Step 7: Deploy to Vercel
      await this.updateProgress('vercel-deployment', 'in-progress', 'Deploying to Vercel...');
      const deployment = await this.deployToVercel(vercelProject.id, config);
      result.deployment.vercel.deploymentId = deployment.id;
      result.deployment.vercel.url = deployment.url;
      await this.updateProgress('vercel-deployment', 'completed', 'Application deployed successfully');

      // Step 8: Configure custom domain (if provided)
      if (config.domain) {
        await this.updateProgress('domain-setup', 'in-progress', 'Configuring custom domain...');
        await this.setupCustomDomain(config, vercelProject.id, result.authentication?.clerk.applicationId);
        await this.updateProgress('domain-setup', 'completed', 'Custom domain configured successfully');
      }

      result.success = true;
      result.progress = this.progress;

      await this.updateProgress('deployment', 'completed', 'Deployment completed successfully! 🎉');

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateProgress('deployment', 'error', `Deployment failed: ${errorMessage}`);
      
      result.success = false;
      result.progress = this.progress;
      
      throw error;
    }
  }

  private async createGitHubRepository(config: DeploymentConfig) {
    const github = new GitHubService(config.github.token, config.github.username);
    
    const repoConfig: GitHubConfig = {
      repoName: config.projectName,
      description: config.description,
      private: config.github.private,
      template: config.template
    };

    return await github.createRepository(repoConfig);
  }

  private async generateTemplateFiles(config: DeploymentConfig, repoName: string) {
    const github = new GitHubService(config.github.token, config.github.username);
    return await github.createInitialFiles(repoName, config.template);
  }

  private async createMongoDBCluster(config: DeploymentConfig) {
    if (!config.mongodb) throw new Error('MongoDB configuration not provided');

    const mongodb = new MongoDBService(config.mongodb.apiKey, config.mongodb.privateKey);
    
    // Create project
    const project = await mongodb.createProject(
      `${config.projectName}-db`,
      config.mongodb.orgId
    );

    // Create cluster
    const clusterConfig: MongoDBConfig = {
      projectName: project.name,
      clusterName: `${config.projectName}-cluster`,
      databaseName: config.projectName,
      region: config.mongodb.region,
      tier: config.mongodb.tier,
      provider: config.mongodb.provider
    };

    const cluster = await mongodb.createCluster(project.id, clusterConfig);
    
    // Wait for cluster to be ready
    const readyCluster = await mongodb.waitForCluster(project.id, cluster.name);
    
    // Create database user
    const username = `${config.projectName}_user`;
    const password = this.generateSecurePassword();
    
    await mongodb.createDatabaseUser(project.id, username, password, config.projectName);
    
    // Configure IP whitelist
    await mongodb.addIPWhitelist(project.id);
    
    // Generate connection string
    const connectionString = mongodb.generateConnectionString(
      readyCluster,
      username,
      password,
      config.projectName
    );

    return {
      connectionString,
      clusterId: cluster.id
    };
  }

  private async createClerkApplication(config: DeploymentConfig) {
    if (!config.clerk) throw new Error('Clerk configuration not provided');

    const clerk = new ClerkService(config.clerk.secretKey);
    
    const clerkConfig: ClerkConfig = {
      applicationName: config.projectName,
      domain: config.domain,
      features: ['authentication', 'organizations']
    };

    const application = await clerk.createApplication(clerkConfig);
    
    // Generate API keys
    const apiKeys = await clerk.createAPIKeys(application.id);
    
    // Setup default configuration
    await clerk.setupDefaultConfiguration(application.id, config.domain);

    return {
      applicationId: application.id,
      publishableKey: apiKeys.publishableKey,
      secretKey: apiKeys.secretKey
    };
  }

  private async createVercelProject(config: DeploymentConfig, envVars: Record<string, string>) {
    const vercel = new VercelService(config.vercel.token, config.vercel.teamId);
    
    const vercelConfig: VercelConfig = {
      projectName: config.projectName,
      gitSource: {
        type: 'github',
        org: config.github.username,
        repo: config.projectName
      },
      framework: 'nextjs',
      environmentVariables: envVars
    };

    return await vercel.createProject(vercelConfig);
  }

  private async deployToVercel(projectId: string, config: DeploymentConfig) {
    const vercel = new VercelService(config.vercel.token, config.vercel.teamId);
    
    const deployment = await vercel.createDeployment(projectId);
    
    // Wait for deployment to complete
    return await vercel.waitForDeployment(deployment.id);
  }

  private async setupCustomDomain(
    config: DeploymentConfig,
    vercelProjectId: string,
    clerkAppId?: string
  ) {
    if (!config.domain) return;

    const vercel = new VercelService(config.vercel.token, config.vercel.teamId);
    await vercel.addDomain(vercelProjectId, config.domain);

    if (clerkAppId && config.clerk) {
      const clerk = new ClerkService(config.clerk.secretKey);
      await clerk.addCustomDomain(clerkAppId, config.domain);
    }
  }

  private generateEnvironmentVariables(
    result: DeploymentResult,
    config: DeploymentConfig
  ): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Clerk environment variables
    if (result.authentication?.clerk) {
      envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = result.authentication.clerk.publishableKey;
      envVars.CLERK_SECRET_KEY = result.authentication.clerk.secretKey;
    }

    // MongoDB environment variables
    if (result.database?.mongodb) {
      envVars.MONGODB_URI = result.database.mongodb.connectionString;
    }

    // Custom domain
    if (config.domain) {
      envVars.NEXT_PUBLIC_DOMAIN = config.domain;
    }

    return envVars;
  }

  private generateProjectId(projectName: string): string {
    return `${projectName}-${Date.now()}`;
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async updateProgress(
    step: string,
    status: DeploymentProgress['status'],
    message: string,
    details?: Record<string, unknown>
  ) {
    const progressUpdate: DeploymentProgress = {
      step,
      status,
      message,
      timestamp: new Date(),
      details
    };

    this.progress.push(progressUpdate);

    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.progress);
    }
  }
} 