export interface MongoDBConfig {
  projectName: string;
  clusterName: string;
  databaseName: string;
  region: string;
  tier: string;
  provider: 'AWS' | 'GCP' | 'AZURE';
}

export interface MongoDBCluster {
  id: string;
  name: string;
  mongoDBVersion: string;
  connectionStrings: {
    standard: string;
    standardSrv: string;
  };
  stateName: 'IDLE' | 'CREATING' | 'UPDATING' | 'DELETING' | 'DELETED' | 'REPAIRING';
}

export interface MongoDBProject {
  id: string;
  name: string;
  orgId: string;
  created: string;
}

export interface MongoDBUser {
  username: string;
  password: string;
  databaseName: string;
  roles: Array<{
    roleName: string;
    databaseName: string;
  }>;
}

export class MongoDBService {
  private apiKey: string;
  private privateKey: string;
  private baseUrl = 'https://cloud.mongodb.com/api/atlas/v1.0';

  constructor(apiKey: string, privateKey: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
  }

  /**
   * Create a new MongoDB Atlas project
   */
  async createProject(projectName: string, orgId: string): Promise<MongoDBProject> {
    try {
      const response = await this.makeRequest('/groups', 'POST', {
        name: projectName,
        orgId: orgId
      });

      return response as MongoDBProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create MongoDB project: ${errorMessage}`);
    }
  }

  /**
   * Create a new MongoDB cluster
   */
  async createCluster(
    projectId: string, 
    config: MongoDBConfig
  ): Promise<MongoDBCluster> {
    try {
      const response = await this.makeRequest(`/groups/${projectId}/clusters`, 'POST', {
        name: config.clusterName,
        clusterType: 'REPLICASET',
        replicationSpec: {
          regionConfigs: [
            {
              electableSpecs: {
                instanceSize: config.tier,
                nodeCount: 3
              },
              providerSettings: {
                providerName: config.provider,
                regionName: config.region,
                instanceSizeName: config.tier
              },
              priority: 7,
              readOnlySpecs: {
                instanceSize: config.tier,
                nodeCount: 0
              }
            }
          ]
        },
        mongoDBMajorVersion: '7.0'
      });

      return response as MongoDBCluster;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create MongoDB cluster: ${errorMessage}`);
    }
  }

  /**
   * Create a database user
   */
  async createDatabaseUser(
    projectId: string,
    username: string,
    password: string,
    databaseName: string = 'admin'
  ): Promise<MongoDBUser> {
    try {
      const userData = {
        username,
        password,
        databaseName,
        roles: [
          {
            roleName: 'readWrite',
            databaseName
          },
          {
            roleName: 'dbAdmin',
            databaseName
          }
        ]
      };

      const response = await this.makeRequest(
        `/groups/${projectId}/databaseUsers`, 
        'POST', 
        userData
      );

      return response as MongoDBUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create database user: ${errorMessage}`);
    }
  }

  /**
   * Add IP whitelist entry (allow all for development)
   */
  async addIPWhitelist(projectId: string): Promise<void> {
    try {
      await this.makeRequest(`/groups/${projectId}/accessList`, 'POST', {
        cidrBlock: '0.0.0.0/0',
        comment: 'Allow access from anywhere (development)'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to configure IP whitelist: ${errorMessage}`);
    }
  }

  /**
   * Get cluster status
   */
  async getCluster(projectId: string, clusterName: string): Promise<MongoDBCluster> {
    try {
      const response = await this.makeRequest(
        `/groups/${projectId}/clusters/${clusterName}`, 
        'GET'
      );
      return response as MongoDBCluster;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get cluster status: ${errorMessage}`);
    }
  }

  /**
   * Wait for cluster to be ready
   */
  async waitForCluster(
    projectId: string,
    clusterName: string,
    maxWaitTime: number = 1800000, // 30 minutes
    pollInterval: number = 30000 // 30 seconds
  ): Promise<MongoDBCluster> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const cluster = await this.getCluster(projectId, clusterName);
      
      if (cluster.stateName === 'IDLE') {
        return cluster;
      }
      
      if (cluster.stateName === 'DELETED') {
        throw new Error('Cluster was deleted');
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Cluster creation timeout exceeded');
  }

  /**
   * Generate connection string
   */
  generateConnectionString(
    cluster: MongoDBCluster,
    username: string,
    password: string,
    databaseName: string
  ): string {
    const baseUrl = cluster.connectionStrings.standardSrv.replace('<password>', password);
    return baseUrl.replace('<username>', username) + `/${databaseName}?retryWrites=true&w=majority`;
  }

  /**
   * Make authenticated request to MongoDB Atlas API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create digest authentication
    const auth = Buffer.from(`${this.apiKey}:${this.privateKey}`).toString('base64');
    
    const headers: Record<string, string> = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
        `MongoDB Atlas API error: ${response.status} ${response.statusText}. ${
          (errorData as { detail?: string }).detail || 'Unknown error'
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