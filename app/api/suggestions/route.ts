import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { TemplateSuggestion, CreateTemplateSuggestionInput } from '@/lib/models/TemplateSuggestion';

export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateSuggestionInput = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<TemplateSuggestion>('template_suggestions');

    const suggestion: Omit<TemplateSuggestion, '_id'> = {
      title: body.title,
      description: body.description,
      category: body.category,
      submitterName: body.submitterName || 'Anonymous',
      submitterUrl: body.submitterUrl,
      codeExample: body.codeExample,
      implementationNotes: body.implementationNotes,
      priority: body.priority || 'medium',
      status: 'pending',
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(suggestion);

    return NextResponse.json(
      { 
        message: 'Suggestion submitted successfully',
        id: result.insertedId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'pending';
    const categoryParam = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDatabase();
    const collection = db.collection<TemplateSuggestion>('template_suggestions');

    // Build query with proper typing
    const query: Partial<TemplateSuggestion> = {};
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'implemented'];
    if (validStatuses.includes(statusParam)) {
      query.status = statusParam as TemplateSuggestion['status'];
    } else {
      query.status = 'pending';
    }
    
    // Validate category
    const validCategories = ['component', 'library', 'feature', 'configuration', 'other'];
    if (categoryParam && validCategories.includes(categoryParam)) {
      query.category = categoryParam as TemplateSuggestion['category'];
    }

    const suggestions = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      suggestions,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 