export interface VercelConfig {
  projectName: string;
  gitSource: {
    type: 'github';
    org: string;
    repo: string;
  };
  framework: string;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables: Record<string, string>;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link: {
    type: string;
    repo: string;
    org: string;
    repoId: number;
  };
  targets: {
    production: {
      domain: string;
      url: string;
    };
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyState: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  creator: {
    uid: string;
    username: string;
  };
}

export class VercelService {
  private apiToken: string;
  private teamId?: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(apiToken: string, teamId?: string) {
    this.apiToken = apiToken;
    this.teamId = teamId;
  }

  /**
   * Create a new Vercel project
   */
  async createProject(config: VercelConfig): Promise<VercelProject> {
    try {
      const response = await this.makeRequest('/v10/projects', 'POST', {
        name: config.projectName,
        framework: config.framework,
        gitRepository: config.gitSource,
        buildCommand: config.buildCommand,
        outputDirectory: config.outputDirectory,
        environmentVariables: Object.entries(config.environmentVariables).map(([key, value]) => ({
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        }))
      });

      return response as VercelProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Vercel project: ${errorMessage}`);
    }
  }

  /**
   * Connect project to GitHub repository
   */
  async linkToGitHub(projectId: string, gitConfig: VercelConfig['gitSource']): Promise<void> {
    try {
      await this.makeRequest(`/v10/projects/${projectId}/link`, 'POST', {
        type: gitConfig.type,
        repo: `${gitConfig.org}/${gitConfig.repo}`,
        gitBranch: 'main'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to link project to GitHub: ${errorMessage}`);
    }
  }

  /**
   * Set environment variables for the project
   */
  async setEnvironmentVariables(
    projectId: string, 
    variables: Record<string, string>
  ): Promise<void> {
    try {
      for (const [key, value] of Object.entries(variables)) {
        await this.makeRequest(`/v10/projects/${projectId}/env`, 'POST', {
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to set environment variables: ${errorMessage}`);
    }
  }

  /**
   * Trigger a deployment
   */
  async createDeployment(projectId: string): Promise<VercelDeployment> {
    try {
      const response = await this.makeRequest('/v13/deployments', 'POST', {
        name: projectId,
        projectSettings: {
          framework: 'nextjs'
        },
        gitSource: {
          type: 'github',
          repoId: projectId
        }
      });

      return response as VercelDeployment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create deployment: ${errorMessage}`);
    }
  }

  /**
   * Get deployment status
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    try {
      const response = await this.makeRequest(`/v13/deployments/${deploymentId}`, 'GET');
      return response as VercelDeployment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get deployment status: ${errorMessage}`);
    }
  }

  /**
   * Get project information
   */
  async getProject(projectId: string): Promise<VercelProject> {
    try {
      const response = await this.makeRequest(`/v10/projects/${projectId}`, 'GET');
      return response as VercelProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get project: ${errorMessage}`);
    }
  }

  /**
   * Set custom domain for project
   */
  async addDomain(projectId: string, domain: string): Promise<void> {
    try {
      await this.makeRequest(`/v10/projects/${projectId}/domains`, 'POST', {
        name: domain
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add custom domain: ${errorMessage}`);
    }
  }

  /**
   * Get all deployments for a project
   */
  async getProjectDeployments(projectId: string): Promise<VercelDeployment[]> {
    try {
      const response = await this.makeRequest(
        `/v6/deployments?projectId=${projectId}&limit=10`, 
        'GET'
      );
      return (response as { deployments: VercelDeployment[] }).deployments || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get project deployments: ${errorMessage}`);
    }
  }

  /**
   * Wait for deployment to complete
   */
  async waitForDeployment(
    deploymentId: string, 
    maxWaitTime: number = 600000, // 10 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<VercelDeployment> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const deployment = await this.getDeployment(deploymentId);
      
      if (deployment.readyState === 'READY' || deployment.readyState === 'ERROR') {
        return deployment;
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Deployment timeout exceeded');
  }

  /**
   * Make HTTP request to Vercel API
   */
  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    body?: unknown
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };

    if (this.teamId) {
      headers['X-Vercel-Team-Id'] = this.teamId;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Vercel API error: ${response.status} ${response.statusText}. ${
          (errorData as { error?: { message?: string } }).error?.message || 'Unknown error'
        }`
      );
    }

    return response.json();
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.makeRequest(`/v10/projects/${projectId}`, 'DELETE');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to delete Vercel project ${projectId}: ${errorMessage}`);
    }
  }
} 