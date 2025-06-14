import { NextResponse } from 'next/server';
import { APIKeyManager } from '@/lib/config/api-keys';

export async function GET() {
  try {
    const manager = new APIKeyManager();
    const services = manager.getServiceStatuses();
    const missingRequired = manager.getMissingRequiredServices();
    const missingOptional = manager.getMissingOptionalServices();
    
    return NextResponse.json({
      success: true,
      data: {
        services,
        hasMinimumConfig: manager.hasMinimumConfig(),
        summary: {
          total: services.length,
          configured: services.filter(s => s.configured).length,
          required: services.filter(s => s.required).length,
          requiredConfigured: services.filter(s => s.required && s.configured).length,
          missingRequired: missingRequired.map(s => s.name),
          missingOptional: missingOptional.map(s => s.name),
        }
      }
    });
  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check API key status'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { service, key } = await request.json();
    
    if (!service || !key) {
      return NextResponse.json({
        success: false,
        error: 'Service and key are required'
      }, { status: 400 });
    }

    const manager = new APIKeyManager();
    
    // Validate format
    const validation = manager.validateAPIKey(service, key);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.message
      }, { status: 400 });
    }

    // Test connectivity (for supported services)
    const testResult = await manager.testAPIKey(service, key);
    
    return NextResponse.json({
      success: true,
      data: {
        validation,
        connectivity: testResult
      }
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test API key'
    }, { status: 500 });
  }
} 