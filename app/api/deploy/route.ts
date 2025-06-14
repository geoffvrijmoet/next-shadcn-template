import { NextRequest, NextResponse } from 'next/server';
import { DeploymentOrchestrator, type DeploymentConfig } from '@/lib/services/deployment-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const deploymentConfig: DeploymentConfig = await request.json();

    // Validate required fields
    if (!deploymentConfig.projectName || !deploymentConfig.github?.token || !deploymentConfig.vercel?.token) {
      return NextResponse.json(
        { error: 'Missing required configuration: projectName, github.token, and vercel.token are required' },
        { status: 400 }
      );
    }

    // Create orchestrator with progress tracking
    const orchestrator = new DeploymentOrchestrator();
    
    // Start deployment
    const result = await orchestrator.deployApplication(deploymentConfig);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Deployment error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Infrastructure Deployment API',
    endpoints: {
      'POST /api/deploy': 'Start a new deployment',
      'GET /api/deploy/status/:id': 'Get deployment status',
      'POST /api/deploy/validate': 'Validate deployment configuration'
    }
  });
} 