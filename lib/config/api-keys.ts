export interface APIKeyConfig {
  github: {
    pat?: string;
    username?: string;
    // GitHub App (future)
    appId?: string;
    privateKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  vercel: {
    token?: string;
    teamId?: string;
  };
  mongodb: {
    apiKey?: string;
    privateKey?: string;
    orgId?: string;
  };
  clerk: {
    secretKey?: string;
  };
  dns: {
    namecheap?: {
      apiKey?: string;
      username?: string;
    };
    cloudflare?: {
      token?: string;
    };
  };
}

export interface ServiceStatus {
  name: string;
  configured: boolean;
  required: boolean;
  setupUrl: string;
  instructions: string[];
  envVars: string[];
}

export class APIKeyManager {
  private config: APIKeyConfig;

  constructor() {
    this.config = this.loadFromEnvironment();
  }

  /**
   * Load API keys from environment variables
   */
  private loadFromEnvironment(): APIKeyConfig {
    return {
      github: {
        pat: process.env.GITHUB_PAT,
        username: process.env.GITHUB_USERNAME,
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_PRIVATE_KEY,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      vercel: {
        token: process.env.VERCEL_TOKEN,
        teamId: process.env.VERCEL_TEAM_ID,
      },
      mongodb: {
        apiKey: process.env.MONGODB_API_KEY,
        privateKey: process.env.MONGODB_PRIVATE_KEY,
        orgId: process.env.MONGODB_ORG_ID,
      },
      clerk: {
        secretKey: process.env.CLERK_SECRET_KEY,
      },
      dns: {
        namecheap: {
          apiKey: process.env.NAMECHEAP_API_KEY,
          username: process.env.NAMECHEAP_USERNAME,
        },
        cloudflare: {
          token: process.env.CLOUDFLARE_TOKEN,
        },
      },
    };
  }

  /**
   * Check status of all services
   */
  getServiceStatuses(): ServiceStatus[] {
    return [
      {
        name: 'GitHub',
        configured: !!(this.config.github.pat && this.config.github.username),
        required: true,
        setupUrl: 'https://github.com/settings/tokens',
        instructions: [
          '1. Go to GitHub Settings → Developer settings → Personal access tokens',
          '2. Click "Generate new token (classic)"',
          '3. Select scopes: repo, user, delete_repo',
          '4. Copy the token and add to environment variables'
        ],
        envVars: ['GITHUB_PAT', 'GITHUB_USERNAME']
      },
      {
        name: 'Vercel',
        configured: !!this.config.vercel.token,
        required: true,
        setupUrl: 'https://vercel.com/account/tokens',
        instructions: [
          '1. Go to Vercel Dashboard → Settings → Tokens',
          '2. Click "Create Token"',
          '3. Give it a name like "Web App Generator"',
          '4. Select appropriate scope (Full Account recommended)',
          '5. Copy the token and add to environment variables'
        ],
        envVars: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID (optional)']
      },
      {
        name: 'MongoDB Atlas',
        configured: !!(this.config.mongodb.apiKey && this.config.mongodb.privateKey && this.config.mongodb.orgId),
        required: false,
        setupUrl: 'https://cloud.mongodb.com/v2/organization/settings/api',
        instructions: [
          '1. Go to MongoDB Atlas → Organization → Settings → API Keys',
          '2. Click "Create API Key"',
          '3. Set permissions: Organization Project Creator',
          '4. Add your IP to access list',
          '5. Copy both Public and Private keys',
          '6. Get Organization ID from organization settings'
        ],
        envVars: ['MONGODB_API_KEY', 'MONGODB_PRIVATE_KEY', 'MONGODB_ORG_ID']
      },
      {
        name: 'Clerk',
        configured: !!this.config.clerk.secretKey,
        required: false,
        setupUrl: 'https://dashboard.clerk.com',
        instructions: [
          '1. Go to Clerk Dashboard → Create Application',
          '2. Choose application type: "I\'m building a platform"',
          '3. Go to API Keys section',
          '4. Copy the Secret Key (starts with sk_live_ or sk_test_)',
          '5. Add to environment variables'
        ],
        envVars: ['CLERK_SECRET_KEY']
      },
      {
        name: 'Namecheap DNS',
        configured: !!(this.config.dns.namecheap?.apiKey && this.config.dns.namecheap?.username),
        required: false,
        setupUrl: 'https://ap.www.namecheap.com/settings/tools/apiaccess/',
        instructions: [
          '1. Go to Namecheap Account → Profile → Tools → API Access',
          '2. Enable API access (may require account verification)',
          '3. Add your server IP to whitelist',
          '4. Copy API Key and Username',
          '5. Add to environment variables'
        ],
        envVars: ['NAMECHEAP_API_KEY', 'NAMECHEAP_USERNAME']
      },
      {
        name: 'Cloudflare DNS',
        configured: !!this.config.dns.cloudflare?.token,
        required: false,
        setupUrl: 'https://dash.cloudflare.com/profile/api-tokens',
        instructions: [
          '1. Go to Cloudflare Dashboard → My Profile → API Tokens',
          '2. Click "Create Token"',
          '3. Use "Custom token" template',
          '4. Permissions: Zone:Zone:Read, Zone:DNS:Edit',
          '5. Zone Resources: Include All zones (or specific zones)',
          '6. Copy the token and add to environment variables'
        ],
        envVars: ['CLOUDFLARE_TOKEN']
      }
    ];
  }

  /**
   * Get missing required services
   */
  getMissingRequiredServices(): ServiceStatus[] {
    return this.getServiceStatuses().filter(service => service.required && !service.configured);
  }

  /**
   * Get missing optional services
   */
  getMissingOptionalServices(): ServiceStatus[] {
    return this.getServiceStatuses().filter(service => !service.required && !service.configured);
  }

  /**
   * Check if minimum required services are configured
   */
  hasMinimumConfig(): boolean {
    const missing = this.getMissingRequiredServices();
    return missing.length === 0;
  }

  /**
   * Get environment variable template
   */
  generateEnvTemplate(): string {
    const envVars = [
      '# Required API Keys',
      '# GitHub Personal Access Token (required)',
      'GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'GITHUB_USERNAME=yourusername',
      '',
      '# Vercel API Token (required)',
      'VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # Optional',
      '',
      '# Optional API Keys',
      '# MongoDB Atlas (optional - for database features)',
      'MONGODB_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      'MONGODB_PRIVATE_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      'MONGODB_ORG_ID=xxxxxxxxxxxxxxxxxxxxxxxx',
      '',
      '# Clerk Authentication (optional - for auth features)', 
      'CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      '',
      '# DNS Providers (optional - for custom domain features)',
      '# Namecheap',
      'NAMECHEAP_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'NAMECHEAP_USERNAME=yourusername',
      '',
      '# Cloudflare (alternative to Namecheap)',
      'CLOUDFLARE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ];

    return envVars.join('\n');
  }

  /**
   * Validate API key format
   */
  validateAPIKey(service: string, key: string): { valid: boolean; message: string } {
    const validations: Record<string, RegExp> = {
      'github-pat': /^ghp_[a-zA-Z0-9]{36}$/,
      'vercel-token': /^[a-zA-Z0-9]{24,}$/,
      'mongodb-key': /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      'clerk-secret': /^sk_(test_|live_)[a-zA-Z0-9]{40,}$/,
    };

    const regex = validations[service];
    if (!regex) {
      return { valid: true, message: 'Format validation not available for this service' };
    }

    const isValid = regex.test(key);
    return {
      valid: isValid,
      message: isValid ? 'Valid format' : 'Invalid format - please check your API key'
    };
  }

  /**
   * Test API key connectivity
   */
  async testAPIKey(service: string, key: string): Promise<{ success: boolean; message: string }> {
    try {
      switch (service) {
        case 'github':
          const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${key}` }
          });
          return {
            success: response.ok,
            message: response.ok ? 'GitHub API connection successful' : 'Invalid GitHub token'
          };

        case 'vercel':
          const vercelResponse = await fetch('https://api.vercel.com/v2/user', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          return {
            success: vercelResponse.ok,
            message: vercelResponse.ok ? 'Vercel API connection successful' : 'Invalid Vercel token'
          };

        default:
          return { success: true, message: 'Test not implemented for this service' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  /**
   * Get configuration for a specific service
   */
  getServiceConfig<T extends keyof APIKeyConfig>(service: T): APIKeyConfig[T] {
    return this.config[service];
  }

  /**
   * Update configuration (for runtime updates)
   */
  updateConfig(updates: Partial<APIKeyConfig>): void {
    this.config = { ...this.config, ...updates };
  }
} 