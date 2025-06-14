import { GitHubService } from './github';
import { GitHubAppService, type GitHubAppConfig } from './github-app';
import { type TemplateVariable } from '@/lib/models/template';

export type GitHubAuthConfig = 
  | { type: 'pat'; token: string; username: string }
  | { type: 'app'; config: GitHubAppConfig; installationId?: number };

export interface UnifiedGitHubRepository {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
}

export class UnifiedGitHubService {
  private patService?: GitHubService;
  private appService?: GitHubAppService;
  private authType: 'pat' | 'app';
  private installationId?: number;

  constructor(authConfig: GitHubAuthConfig) {
    this.authType = authConfig.type;

    if (authConfig.type === 'pat') {
      this.patService = new GitHubService(authConfig.token, authConfig.username);
    } else {
      this.appService = new GitHubAppService(authConfig.config);
      this.installationId = authConfig.installationId;
    }
  }

  /**
   * Create repository with unified interface
   */
  async createRepository(config: {
    name: string;
    description: string;
    private: boolean;
    owner?: string;
  }): Promise<UnifiedGitHubRepository> {
    if (this.authType === 'pat' && this.patService) {
      return await this.patService.createRepository({
        repoName: config.name,
        description: config.description,
        private: config.private,
      });
    } else if (this.authType === 'app' && this.appService && this.installationId) {
      return await this.appService.createRepository(this.installationId, config);
    } else {
      throw new Error('GitHub service not properly configured');
    }
  }

  /**
   * Create initial files with template support
   */
  async createInitialFiles(
    repoName: string,
    templateId: string,
    variables: TemplateVariable[] = [],
    owner?: string
  ): Promise<void> {
    if (this.authType === 'pat' && this.patService) {
      await this.patService.createInitialFiles(repoName, templateId, variables);
    } else if (this.authType === 'app' && this.appService && this.installationId) {
      // For GitHub Apps, we need to implement template file creation
      await this.createTemplateFilesWithApp(this.installationId, owner || '', repoName, templateId, variables);
    } else {
      throw new Error('GitHub service not properly configured');
    }
  }

  /**
   * Check if user has GitHub App installed
   */
  async checkInstallation(owner: string): Promise<boolean> {
    if (this.authType === 'app' && this.appService) {
      return await this.appService.hasInstallation(owner);
    }
    return false; // PAT doesn't have installations
  }

  /**
   * Get installation URL for GitHub App
   */
  getInstallationURL(redirectUrl?: string): string {
    if (this.authType === 'app' && this.appService) {
      return this.appService.generateInstallationURL(redirectUrl);
    }
    throw new Error('Installation URL only available for GitHub Apps');
  }

  /**
   * Get available repositories (for app users)
   */
  async getAccessibleRepositories(): Promise<any[]> {
    if (this.authType === 'app' && this.appService && this.installationId) {
      return await this.appService.getInstallationRepositories(this.installationId);
    }
    return []; // For PAT, user has access to all their repos
  }

  /**
   * Create template files using GitHub App
   */
  private async createTemplateFilesWithApp(
    installationId: number,
    owner: string,
    repo: string,
    templateId: string,
    variables: TemplateVariable[]
  ): Promise<void> {
    if (!this.appService) throw new Error('GitHub App service not configured');

    // Import template manager
    const { TemplateManager } = await import('./template-manager');
    const templateManager = new TemplateManager();

    // Get and process template
    const template = await templateManager.getTemplate(templateId);
    const processedFiles = template.files.map(file => ({
      ...file,
      content: templateManager.processTemplateVariables(file.content, variables)
    }));

    // Create each file using GitHub App
    for (const file of processedFiles) {
      await this.appService.createFile(
        installationId,
        owner,
        repo,
        file.path,
        file.content,
        `Add ${file.path}`
      );
    }

    // Create package.json
    const packageJson = {
      name: variables.find(v => v.key === 'projectName')?.value || repo,
      version: "0.1.0",
      private: true,
      scripts: template.scripts,
      dependencies: template.dependencies,
      devDependencies: template.devDependencies
    };

    await this.appService.createFile(
      installationId,
      owner,
      repo,
      'package.json',
      JSON.stringify(packageJson, null, 2),
      'Add package.json with dependencies'
    );
  }

  /**
   * Get authentication info for debugging
   */
  getAuthInfo(): { type: 'pat' | 'app'; hasInstallation: boolean } {
    return {
      type: this.authType,
      hasInstallation: !!(this.authType === 'app' && this.installationId)
    };
  }

  /**
   * Switch to different installation (for GitHub Apps)
   */
  switchInstallation(installationId: number): void {
    if (this.authType === 'app') {
      this.installationId = installationId;
    } else {
      throw new Error('Installation switching only available for GitHub Apps');
    }
  }
}

/**
 * Factory function to create appropriate GitHub service
 */
export function createGitHubService(authConfig: GitHubAuthConfig): UnifiedGitHubService {
  return new UnifiedGitHubService(authConfig);
}

/**
 * Detect best authentication method based on environment
 */
export function detectGitHubAuth(): GitHubAuthConfig {
  // Try GitHub App first (production)
  if (process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY) {
    return {
      type: 'app',
      config: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }
    };
  }

  // Fall back to PAT (development)
  if (process.env.GITHUB_PAT && process.env.GITHUB_USERNAME) {
    return {
      type: 'pat',
      token: process.env.GITHUB_PAT,
      username: process.env.GITHUB_USERNAME
    };
  }

  throw new Error('No GitHub authentication configured. Set either GitHub App or PAT environment variables.');
} 