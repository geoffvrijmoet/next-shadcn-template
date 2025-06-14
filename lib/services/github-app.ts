import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import jwt from 'jsonwebtoken';

export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  clientId?: string;
  clientSecret?: string;
  installationId?: string;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    type: 'User' | 'Organization';
  };
  permissions: Record<string, string>;
  repositories_url: string;
}

export class GitHubAppService {
  private appId: string;
  private privateKey: string;
  private clientId?: string;
  private clientSecret?: string;
  private octokit: Octokit;

  constructor(config: GitHubAppConfig) {
    this.appId = config.appId;
    this.privateKey = config.privateKey;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;

    // Initialize Octokit with app authentication
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      },
    });
  }

  /**
   * Get all installations of this GitHub App
   */
  async getInstallations(): Promise<GitHubInstallation[]> {
    try {
      const { data } = await this.octokit.apps.listInstallations();
      return data as GitHubInstallation[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get installations: ${errorMessage}`);
    }
  }

  /**
   * Get installation for a specific user/organization
   */
  async getInstallation(owner: string): Promise<GitHubInstallation> {
    try {
      const { data } = await this.octokit.apps.getOrgInstallation({ org: owner });
      return data as GitHubInstallation;
    } catch (error) {
      try {
        const { data } = await this.octokit.apps.getUserInstallation({ username: owner });
        return data as GitHubInstallation;
      } catch {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Installation not found for ${owner}: ${errorMessage}`);
      }
    }
  }

  /**
   * Create repository using installation token
   */
  async createRepository(
    installationId: number,
    repoConfig: {
      name: string;
      description: string;
      private: boolean;
      owner?: string; // For org repos
    }
  ): Promise<any> {
    try {
      // Get installation-specific Octokit instance
      const installationOctokit = await this.getInstallationOctokit(installationId);

      let response;
      if (repoConfig.owner) {
        // Create in organization
        response = await installationOctokit.repos.createInOrg({
          org: repoConfig.owner,
          name: repoConfig.name,
          description: repoConfig.description,
          private: repoConfig.private,
          auto_init: true,
          license_template: 'mit',
        });
      } else {
        // Create in user account
        response = await installationOctokit.repos.createForAuthenticatedUser({
          name: repoConfig.name,
          description: repoConfig.description,
          private: repoConfig.private,
          auto_init: true,
          license_template: 'mit',
        });
      }

      return {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        htmlUrl: response.data.html_url,
        cloneUrl: response.data.clone_url,
        sshUrl: response.data.ssh_url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create repository: ${errorMessage}`);
    }
  }

  /**
   * Create file in repository using installation token
   */
  async createFile(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    try {
      const installationOctokit = await this.getInstallationOctokit(installationId);

      await installationOctokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create file: ${errorMessage}`);
    }
  }

  /**
   * Generate installation URL for users to install the app
   */
  generateInstallationURL(redirectUrl?: string): string {
    const baseUrl = `https://github.com/apps/${this.getAppSlug()}/installations/new`;
    if (redirectUrl) {
      return `${baseUrl}?state=${encodeURIComponent(redirectUrl)}`;
    }
    return baseUrl;
  }

  /**
   * Handle installation webhook
   */
  async handleInstallationWebhook(payload: any): Promise<void> {
    const { action, installation } = payload;

    switch (action) {
      case 'created':
        console.log(`App installed for ${installation.account.login}`);
        // Store installation in your database
        await this.storeInstallation(installation);
        break;
      case 'deleted':
        console.log(`App uninstalled for ${installation.account.login}`);
        // Remove installation from your database
        await this.removeInstallation(installation.id);
        break;
      case 'repositories_added':
        console.log(`Repositories added to installation ${installation.id}`);
        break;
      case 'repositories_removed':
        console.log(`Repositories removed from installation ${installation.id}`);
        break;
    }
  }

  /**
   * Get repositories accessible by an installation
   */
  async getInstallationRepositories(installationId: number): Promise<any[]> {
    try {
      const installationOctokit = await this.getInstallationOctokit(installationId);
      const { data } = await installationOctokit.apps.listReposAccessibleToInstallation();
      return data.repositories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get installation repositories: ${errorMessage}`);
    }
  }

  /**
   * Create app JWT for authentication
   */
  private createJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 60 seconds in the past
      exp: now + 10 * 60, // Expires in 10 minutes
      iss: this.appId,
    };

    return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' });
  }

  /**
   * Get installation-specific Octokit instance
   */
  private async getInstallationOctokit(installationId: number): Promise<Octokit> {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId,
      },
    });
  }

  /**
   * Get app slug from GitHub API
   */
  private getAppSlug(): string {
    // You'll need to store this when you create the app
    // For now, return a placeholder
    return 'your-app-name';
  }

  /**
   * Store installation in database (implement based on your database)
   */
  private async storeInstallation(installation: any): Promise<void> {
    // TODO: Implement database storage
    console.log('Storing installation:', installation.id);
  }

  /**
   * Remove installation from database
   */
  private async removeInstallation(installationId: number): Promise<void> {
    // TODO: Implement database removal
    console.log('Removing installation:', installationId);
  }

  /**
   * Check if user has app installed
   */
  async hasInstallation(owner: string): Promise<boolean> {
    try {
      await this.getInstallation(owner);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get installation access token (for frontend use)
   */
  async getInstallationToken(installationId: number): Promise<string> {
    try {
      const { data } = await this.octokit.apps.createInstallationAccessToken({
        installation_id: installationId,
      });
      return data.token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get installation token: ${errorMessage}`);
    }
  }
} 