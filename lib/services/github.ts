import { Octokit } from '@octokit/rest';
import { TemplateManager } from './template-manager';
import { type Template, type TemplateVariable } from '@/lib/models/template';

export interface GitHubConfig {
  repoName: string;
  description: string;
  private: boolean;
  templateId?: string;
  templateVariables?: TemplateVariable[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
}

export interface RepositoryContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  // Allow additional fields returned by the GitHub API without losing type‐safety
  [key: string]: unknown;
}

export class GitHubService {
  private octokit: Octokit;
  private username: string;
  private templateManager: TemplateManager;

  constructor(token: string, username: string) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.username = username;
    this.templateManager = new TemplateManager();
  }

  /**
   * Create a new GitHub repository
   */
  async createRepository(config: GitHubConfig): Promise<GitHubRepository> {
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: config.repoName,
        description: config.description,
        private: config.private,
        auto_init: true, // Initialize with README
        license_template: 'mit',
      });

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
      throw new Error(`Failed to create GitHub repository: ${errorMessage}`);
    }
  }

  /**
   * Create initial files in the repository using template system
   */
  async createInitialFiles(
    repoName: string, 
    templateId: string,
    variables: TemplateVariable[] = []
  ): Promise<void> {
    try {
      // Get template from template manager
      const template = await this.templateManager.getTemplate(templateId);
      
      // Process template variables
      const processedFiles = template.files.map(file => ({
        ...file,
        content: this.templateManager.processTemplateVariables(file.content, variables)
      }));

      // Create each file in the repository
      for (const file of processedFiles) {
        await this.createFile(
          repoName, 
          file.path, 
          file.content, 
          `Add ${file.path}`
        );
      }

      // Create package.json with processed dependencies
      const packageJson = {
        name: variables.find(v => v.key === 'projectName')?.value || repoName,
        version: "0.1.0",
        private: true,
        scripts: template.scripts,
        dependencies: template.dependencies,
        devDependencies: template.devDependencies
      };

      await this.createFile(
        repoName,
        'package.json',
        JSON.stringify(packageJson, null, 2),
        'Add package.json with dependencies'
      );

      // Create .env.local.example with template variables
      if (template.environmentVariables.length > 0) {
        const envContent = template.environmentVariables
          .map(envVar => `# ${envVar.description}\n${envVar.key}=${envVar.defaultValue || 'your_value_here'}`)
          .join('\n\n');

        await this.createFile(
          repoName,
          '.env.local.example',
          envContent,
          'Add environment variables example'
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create initial files: ${errorMessage}`);
    }
  }

  /**
   * Create a single file in the repository
   */
  private async createFile(
    repoName: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.username,
      repo: repoName,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
    });
  }

  /**
   * Update a file in the repository
   */
  async updateFile(
    repoName: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    try {
      // Get the current file to get its SHA
      const { data: currentFile } = await this.octokit.repos.getContent({
        owner: this.username,
        repo: repoName,
        path,
      });

      if ('sha' in currentFile) {
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.username,
          repo: repoName,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          sha: currentFile.sha,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update file: ${errorMessage}`);
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(repoName: string, path: string = ''): Promise<RepositoryContentItem[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.username,
        repo: repoName,
        path,
      });

      // Ensure the return type is always an array for easier consumption by callers
      return Array.isArray(data)
        ? (data as RepositoryContentItem[])
        : ([data as RepositoryContentItem]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get repository contents: ${errorMessage}`);
    }
  }

  /**
   * Create a new template from an existing repository
   */
  async createTemplateFromRepo(
    repoName: string,
    templateName: string,
    templateDescription: string
  ): Promise<Template> {
    try {
      const contents = await this.getRepositoryContents(repoName);
      const files = [];

      // Process each file in the repository
      for (const item of contents) {
        if (item.type === 'file') {
          const { data: fileData } = await this.octokit.repos.getContent({
            owner: this.username,
            repo: repoName,
            path: item.path,
          });

          if ('content' in fileData) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            
            files.push({
              id: crypto.randomUUID(),
              path: item.path,
              content,
              language: this.getLanguageFromPath(item.path),
              isRequired: ['package.json', 'next.config.js', 'tsconfig.json'].includes(item.name),
              category: this.getCategoryFromPath(item.path)
            });
          }
        }
      }

      // Create template object
      const template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'> = {
        name: templateName,
        description: templateDescription,
        category: 'custom',
        version: '1.0.0',
        author: this.username,
        tags: [],
        files,
        dependencies: {},
        devDependencies: {},
        scripts: {},
        environmentVariables: [],
        features: [],
        isPublic: false
      };

      return await this.templateManager.createTemplate(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create template from repository: ${errorMessage}`);
    }
  }

  private getLanguageFromPath(path: string): 'typescript' | 'javascript' | 'json' | 'css' | 'markdown' | 'text' {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'css':
      case 'scss':
      case 'sass':
        return 'css';
      case 'md':
      case 'mdx':
        return 'markdown';
      default:
        return 'text';
    }
  }

  private getCategoryFromPath(path: string): 'config' | 'component' | 'page' | 'api' | 'style' | 'docs' | 'other' {
    if (path.includes('components/')) return 'component';
    if (path.includes('pages/') || path.includes('app/')) return 'page';
    if (path.includes('api/')) return 'api';
    if (path.includes('styles/') || path.endsWith('.css')) return 'style';
    if (path.endsWith('.md') || path.endsWith('.mdx')) return 'docs';
    if (['package.json', 'next.config.js', 'tsconfig.json', 'tailwind.config.ts'].includes(path)) return 'config';
    return 'other';
  }
} 