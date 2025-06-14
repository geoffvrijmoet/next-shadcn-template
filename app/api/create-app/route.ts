import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/lib/mongodb';
import { GitHubService } from '@/lib/services/github';
import { VercelService } from '@/lib/services/vercel';
import { MongoDBService } from '@/lib/services/mongodb';
import { ClerkService } from '@/lib/services/clerk';
import { GoogleCloudService } from '@/lib/services/google-cloud';

interface CreateAppRequest {
  projectName: string;
  description: string;
  template: string;
  githubRepo: string;
  domain?: string;
  targetCluster: string;
  features: string[];
}

interface ApiKeys {
  github: string;
  vercel: string;
  mongodb: string;
  clerk: string;
  googleCloud: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAppRequest = await request.json();
    
    // Validate required fields
    const { projectName, description, template, githubRepo, targetCluster, features } = body;
    
    if (!projectName || !description || !template || !githubRepo || !targetCluster) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required API keys
    const ENV = (globalThis as any).process?.env ?? {};

    const apiKeys: Partial<ApiKeys> = {
      github: ENV.GITHUB_PAT || '',
      vercel: ENV.VERCEL_TOKEN || '',
      mongodb: ENV.MONGODB_ATLAS_API_KEY || '',
      clerk: ENV.CLERK_API_KEY || '',
      googleCloud: ENV.GOOGLE_CLOUD_API_KEY || ''
    };

    const missingKeys = Object.entries(apiKeys)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing API keys', 
          missingKeys,
          message: 'Configure the required API keys in your environment variables'
        },
        { status: 500 }
      );
    }

    // Store the deployment request in database for tracking
    const deploymentId = await createDeploymentRecord(body);

    // Initiate the deployment process
    await initiateDeployment(deploymentId, body, apiKeys as ApiKeys);

    return NextResponse.json({
      message: 'Deployment initiated successfully',
      deploymentId,
      status: 'started'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createDeploymentRecord(request: CreateAppRequest): Promise<string> {
  // This will store deployment info in MongoDB for tracking
  const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const steps = [
    {
      id: 'github',
      name: 'Create GitHub Repository',
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
    },
    {
      id: 'vercel',
      name: 'Create Vercel Project & Deploy',
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
    },
    {
      id: 'mongodb',
      name: 'Provision MongoDB Atlas Cluster',
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
    },
    {
      id: 'clerk',
      name: 'Create Clerk Application',
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
    },
    {
      id: 'google',
      name: 'Setup Google Cloud Project',
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
    },
  ];

  const record = {
    deploymentId,
    projectName: request.projectName,
    description: request.description,
    template: request.template,
    githubRepo: request.githubRepo,
    domain: request.domain,
    targetCluster: request.targetCluster,
    features: request.features,
    status: 'pending' as const,
    steps,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const db = await getDatabase();
    await db.collection('deployments').insertOne(record);
  } catch (err) {
    console.error('Failed to insert deployment record', err);
  }

  console.log('Created deployment record', deploymentId);
  return deploymentId;
}

async function initiateDeployment(
  deploymentId: string, 
  request: CreateAppRequest, 
  apiKeys: ApiKeys
) {
  console.log('Initiating deployment:', deploymentId, request.projectName);

  const db = await getDatabase();

  const ENV = (globalThis as any).process?.env ?? {};

  const githubUsername = (globalThis as any).process?.env?.GITHUB_USERNAME ?? '';
  if (!githubUsername) {
    throw new Error('GITHUB_USERNAME env variable is required');
  }

  // Helper to update step status
  async function updateStep(stepId: string, data: Partial<{ status: string; startedAt?: Date; completedAt?: Date; message?: string; error?: string }>) {
    await db.collection('deployments').updateOne(
      { deploymentId, 'steps.id': stepId },
      {
        $set: {
          'steps.$.status': data.status,
          'steps.$.startedAt': data.startedAt,
          'steps.$.completedAt': data.completedAt,
          'steps.$.message': data.message,
          'steps.$.error': data.error,
          updatedAt: new Date(),
        },
      }
    );
  }

  // 1. Create GitHub repository
  try {
    await updateStep('github', { status: 'in-progress', startedAt: new Date() });

    const githubToken = apiKeys.github;
    const githubService = new GitHubService(githubToken, githubUsername);

    const repo = await githubService.createRepository({
      repoName: request.githubRepo,
      description: request.description,
      private: true,
    });

    // Update deployment record with GitHub URL
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          githubUrl: repo.htmlUrl,
        },
      }
    );

    await updateStep('github', { status: 'completed', completedAt: new Date() });
  } catch (err) {
    console.error('GitHub step failed', err);
    await updateStep('github', { status: 'error', completedAt: new Date(), error: String(err) });
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          status: 'failed',
          error: String(err),
          errorStep: 'github',
          completedAt: new Date(),
        },
      }
    );
    return; // Abort further steps
  }

  // If we reach here, GitHub repo was successful. Future steps would continue similarly.

  // 2. Create Vercel project & initial deploy
  try {
    await updateStep('vercel', { status: 'in-progress', startedAt: new Date() });

    const vercelToken = apiKeys.vercel;
    const vercelTeamId = (globalThis as any).process?.env?.VERCEL_TEAM_ID ?? undefined;
    if (!vercelToken) {
      throw new Error('Missing VERCEL_TOKEN env variable');
    }

    const vercelService = new VercelService(vercelToken, vercelTeamId);

    // Create Vercel project linked to GitHub repo
    const project = await vercelService.createProject({
      projectName: request.githubRepo, // use repo name to match
      gitSource: {
        type: 'github',
        org: githubUsername,
        repo: request.githubRepo,
      },
      framework: 'nextjs',
      environmentVariables: {},
    });

    // Wait for latest deployment to become ready (optional)
    const deployments = await vercelService.getProjectDeployments(project.id);
    if (deployments.length > 0) {
      const latest = deployments[0];
      try {
        const finalDeployment = await vercelService.waitForDeployment(latest.id, 600000, 10000);
        if (finalDeployment.readyState !== 'READY') {
          throw new Error(`Deployment ended in state ${finalDeployment.readyState}`);
        }
      } catch (deployErr) {
        console.warn('Deployment wait error (non-fatal):', deployErr);
      }
    }

    // Update deployment record with Vercel URL if available
    const prodUrl = project.targets?.production?.url ?? null;
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          vercelUrl: prodUrl ? `https://${prodUrl}` : undefined,
        },
      }
    );

    await updateStep('vercel', { status: 'completed', completedAt: new Date() });
  } catch (err) {
    console.error('Vercel step failed', err);
    await updateStep('vercel', { status: 'error', completedAt: new Date(), error: String(err) });
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          status: 'failed',
          error: String(err),
          errorStep: 'vercel',
          completedAt: new Date(),
        },
      }
    );
    return;
  }

  // 3. Provision MongoDB Atlas cluster
  try {
    await updateStep('mongodb', { status: 'in-progress', startedAt: new Date() });

    const mongoPublicKey = apiKeys.mongodb; // public API key retrieved earlier
    const mongoPrivateKey = (ENV.MONGODB_PRIVATE_KEY || '') as string;
    const mongoOrgId = (ENV.MONGODB_ORG_ID || '') as string;

    if (!mongoPublicKey || !mongoPrivateKey || !mongoOrgId) {
      throw new Error('Missing MongoDB Atlas API credentials (MONGODB_ATLAS_API_KEY, MONGODB_PRIVATE_KEY, MONGODB_ORG_ID)');
    }

    const mongoService = new MongoDBService(mongoPublicKey, mongoPrivateKey);

    // 3.1 Create Project (if not existing) – project names must be unique inside Org
    const atlasProject = await mongoService.createProject(request.projectName, mongoOrgId);

    // 3.2 Create Cluster
    const clusterName = `${request.projectName.replace(/\s+/g, '-')}-cluster`;
    const clusterConfig = {
      projectName: request.projectName,
      clusterName,
      databaseName: request.projectName.replace(/\s+/g, '_').toLowerCase(),
      region: 'US_EAST_1',
      tier: 'M0',
      provider: 'AWS' as const,
    };

    await mongoService.createCluster(atlasProject.id, clusterConfig);

    // Optional: wait until ready (may take ~10 mins)
    try {
      await mongoService.waitForCluster(atlasProject.id, clusterConfig.clusterName, 1800000, 30000);
    } catch (waitErr) {
      console.warn('Cluster readiness wait timed out or errored – proceeding anyway:', waitErr);
    }

    // 3.3 Add IP whitelist (0.0.0.0/0 for dev)
    await mongoService.addIPWhitelist(atlasProject.id);

    // 3.4 Create DB user
    const dbUsername = 'app_user';
    const dbPassword = Math.random().toString(36).slice(-16);
    await mongoService.createDatabaseUser(atlasProject.id, dbUsername, dbPassword, clusterConfig.databaseName);

    // 3.5 Generate Connection String
    const clusterInfo = await mongoService.getCluster(atlasProject.id, clusterConfig.clusterName);
    const connString = mongoService.generateConnectionString(clusterInfo, dbUsername, dbPassword, clusterConfig.databaseName);

    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          mongodbConnectionString: connString,
        },
      }
    );

    await updateStep('mongodb', { status: 'completed', completedAt: new Date() });
  } catch (err) {
    console.error('MongoDB step failed', err);
    await updateStep('mongodb', { status: 'error', completedAt: new Date(), error: String(err) });
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          status: 'failed',
          error: String(err),
          errorStep: 'mongodb',
          completedAt: new Date(),
        },
      }
    );
    return;
  }

  // 4. Create Clerk application
  try {
    await updateStep('clerk', { status: 'in-progress', startedAt: new Date() });

    const clerkSecret = apiKeys.clerk;
    if (!clerkSecret) {
      throw new Error('Missing CLERK_API_KEY env variable');
    }

    const clerkService = new ClerkService(clerkSecret);

    // Create application (using projectName as name) and domain if provided
    const clerkApp = await clerkService.createApplication({
      applicationName: request.projectName,
      domain: request.domain,
      features: [],
    });

    // Setup default configuration
    await clerkService.setupDefaultConfiguration(clerkApp.id, request.domain);

    // Generate API keys
    const { publishableKey, secretKey } = await clerkService.createAPIKeys(clerkApp.id);

    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          clerkApplicationId: clerkApp.id,
          clerkPublishableKey: publishableKey,
          clerkSecretKey: secretKey,
        },
      }
    );

    await updateStep('clerk', { status: 'completed', completedAt: new Date() });
  } catch (err) {
    console.error('Clerk step failed', err);
    await updateStep('clerk', { status: 'error', completedAt: new Date(), error: String(err) });
    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          status: 'failed',
          error: String(err),
          errorStep: 'clerk',
          completedAt: new Date(),
        },
      }
    );
    return;
  }

  // 5. Setup Google Cloud project (optional)
  try {
    await updateStep('google', { status: 'in-progress', startedAt: new Date() });

    const gcpEmail = ENV.GOOGLE_CLIENT_EMAIL as string | undefined;
    const gcpPrivateKey = (ENV.GOOGLE_PRIVATE_KEY as string | undefined)?.replace(/\\n/g, '\n');
    if (!gcpEmail || !gcpPrivateKey) {
      throw new Error('Missing Google service account credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)');
    }

    const googleService = new GoogleCloudService(gcpEmail, gcpPrivateKey);

    const projectIdBase = request.projectName.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 25);
    const uniqueSuffix = Math.random().toString(36).substr(2, 4);
    const projectId = `${projectIdBase}-${uniqueSuffix}`;

    await googleService.createProject({
      projectId,
      projectName: request.projectName,
      enableApis: [],
    });

    await db.collection('deployments').updateOne(
      { deploymentId },
      {
        $set: {
          googleCloudProjectId: projectId,
        },
      }
    );

    await updateStep('google', { status: 'completed', completedAt: new Date() });
  } catch (err) {
    console.error('Google Cloud step failed', err);
    await updateStep('google', { status: 'error', completedAt: new Date(), error: String(err) });
    // Do not fail entire deployment if GCP creds missing — treat as optional
  }

  // All steps completed
  await db.collection('deployments').updateOne(
    { deploymentId },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
      },
    }
  );

  console.log(`Deployment ${deploymentId} completed successfully`);
} 