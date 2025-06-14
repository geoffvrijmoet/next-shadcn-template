export interface ClerkConfig {
  applicationName: string;
  domain?: string;
  features: string[];
}

export interface ClerkApplication {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'development' | 'production';
  instance_type: 'development' | 'production';
  sign_in_url: string;
  sign_up_url: string;
  home_url: string;
  favicon_url?: string;
  logo_url?: string;
}

export interface ClerkAPIKey {
  object: 'api_key';
  id: string;
  key: string;
  created_at: number;
  updated_at: number;
}

export interface ClerkJWTTemplate {
  id: string;
  name: string;
  claims: Record<string, unknown>;
  lifetime: number;
  allowed_clock_skew: number;
}

export class ClerkService {
  private secretKey: string;
  private baseUrl = 'https://api.clerk.com/v1';

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Create a new Clerk application
   */
  async createApplication(config: ClerkConfig): Promise<ClerkApplication> {
    try {
      const response = await this.makeRequest('/instances', 'POST', {
        name: config.applicationName,
        type: 'development',
        allowed_origins: config.domain ? [`https://${config.domain}`] : ['http://localhost:3000'],
        home_url: config.domain ? `https://${config.domain}` : 'http://localhost:3000'
      });

      return response as ClerkApplication;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Clerk application: ${errorMessage}`);
    }
  }

  /**
   * Get application details
   */
  async getApplication(applicationId: string): Promise<ClerkApplication> {
    try {
      const response = await this.makeRequest(`/instances/${applicationId}`, 'GET');
      return response as ClerkApplication;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get Clerk application: ${errorMessage}`);
    }
  }

  /**
   * Generate API keys for the application
   */
  async createAPIKeys(applicationId: string): Promise<{
    publishableKey: string;
    secretKey: string;
  }> {
    try {
      // Generate publishable key
      const pubKeyResponse = await this.makeRequest(
        `/instances/${applicationId}/api_keys`,
        'POST',
        { type: 'publishable' }
      );

      // Generate secret key
      const secretKeyResponse = await this.makeRequest(
        `/instances/${applicationId}/api_keys`,
        'POST',
        { type: 'secret' }
      );

      return {
        publishableKey: (pubKeyResponse as ClerkAPIKey).key,
        secretKey: (secretKeyResponse as ClerkAPIKey).key
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Clerk API keys: ${errorMessage}`);
    }
  }

  /**
   * Configure sign-in options
   */
  async configureSignInOptions(
    applicationId: string,
    options: {
      emailEnabled: boolean;
      phoneEnabled: boolean;
      usernameEnabled: boolean;
      socialProviders: string[];
    }
  ): Promise<void> {
    try {
      await this.makeRequest(`/instances/${applicationId}/sign_in`, 'PATCH', {
        email_address: options.emailEnabled,
        phone_number: options.phoneEnabled,
        username: options.usernameEnabled,
        social: options.socialProviders.length > 0,
        social_providers: options.socialProviders
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to configure sign-in options: ${errorMessage}`);
    }
  }

  /**
   * Configure sign-up options
   */
  async configureSignUpOptions(
    applicationId: string,
    options: {
      emailEnabled: boolean;
      phoneEnabled: boolean;
      usernameEnabled: boolean;
      socialProviders: string[];
      requireEmailVerification: boolean;
    }
  ): Promise<void> {
    try {
      await this.makeRequest(`/instances/${applicationId}/sign_up`, 'PATCH', {
        email_address: options.emailEnabled,
        phone_number: options.phoneEnabled,
        username: options.usernameEnabled,
        social: options.socialProviders.length > 0,
        social_providers: options.socialProviders,
        require_email_verification: options.requireEmailVerification
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to configure sign-up options: ${errorMessage}`);
    }
  }

  /**
   * Set up custom domain
   */
  async addCustomDomain(applicationId: string, domain: string): Promise<void> {
    try {
      await this.makeRequest(`/instances/${applicationId}/domains`, 'POST', {
        name: domain,
        is_satellite: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add custom domain: ${errorMessage}`);
    }
  }

  /**
   * Create JWT template for custom claims
   */
  async createJWTTemplate(
    applicationId: string,
    templateName: string,
    claims: Record<string, unknown>
  ): Promise<ClerkJWTTemplate> {
    try {
      const response = await this.makeRequest(
        `/instances/${applicationId}/jwt_templates`,
        'POST',
        {
          name: templateName,
          claims,
          lifetime: 3600, // 1 hour
          allowed_clock_skew: 5
        }
      );

      return response as ClerkJWTTemplate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create JWT template: ${errorMessage}`);
    }
  }

  /**
   * Configure organization settings
   */
  async enableOrganizations(applicationId: string): Promise<void> {
    try {
      await this.makeRequest(`/instances/${applicationId}/organizations`, 'PATCH', {
        enabled: true,
        max_allowed_memberships: 100,
        admin_delete_enabled: true
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to enable organizations: ${errorMessage}`);
    }
  }

  /**
   * Get all API keys for an application
   */
  async getAPIKeys(applicationId: string): Promise<ClerkAPIKey[]> {
    try {
      const response = await this.makeRequest(`/instances/${applicationId}/api_keys`, 'GET');
      return (response as ClerkAPIKey[]) || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get API keys: ${errorMessage}`);
    }
  }

  /**
   * Set up default configuration for a new app
   */
  async setupDefaultConfiguration(applicationId: string, domain?: string): Promise<void> {
    try {
      // Configure basic sign-in/sign-up
      await this.configureSignInOptions(applicationId, {
        emailEnabled: true,
        phoneEnabled: false,
        usernameEnabled: false,
        socialProviders: ['google', 'github']
      });

      await this.configureSignUpOptions(applicationId, {
        emailEnabled: true,
        phoneEnabled: false,
        usernameEnabled: false,
        socialProviders: ['google', 'github'],
        requireEmailVerification: true
      });

      // Enable organizations for team features
      await this.enableOrganizations(applicationId);

      // Add custom domain if provided
      if (domain) {
        await this.addCustomDomain(applicationId, domain);
      }

      // Create default JWT template
      await this.createJWTTemplate(applicationId, 'default', {
        email: '{{user.email_addresses.0.email_address}}',
        firstName: '{{user.first_name}}',
        lastName: '{{user.last_name}}',
        userId: '{{user.id}}'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to setup default configuration: ${errorMessage}`);
    }
  }

  /**
   * Make authenticated request to Clerk API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: unknown
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };

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
        `Clerk API error: ${response.status} ${response.statusText}. ${
          (errorData as { errors?: Array<{ message: string }> }).errors?.[0]?.message || 'Unknown error'
        }`
      );
    }

    // Handle empty responses
    if (response.status === 204) {
      return {};
    }

    return response.json();
  }
} 