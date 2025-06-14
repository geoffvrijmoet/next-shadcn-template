import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/lib/mongodb';
import { GitHubService } from '@/lib/services/github';

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
      vercel: ENV.VERCEL_API_TOKEN || '',
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
    const githubUsername = (globalThis as any).process?.env?.GITHUB_USERNAME ?? '';
    if (!githubUsername) {
      throw new Error('GITHUB_USERNAME env variable is required');
    }

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

  // Mark deployment completed for now (until more steps implemented)
  await db.collection('deployments').updateOne(
    { deploymentId },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
      },
    }
  );

  console.log(`Deployment ${deploymentId} completed`);
} 