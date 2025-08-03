import { NextResponse } from 'next/server';
import aiKB from '../../../lib/ai-knowledge-base';

// GET - Retrieve current knowledge base
export async function GET() {
  try {
    const knowledgeBase = await aiKB.getKnowledgeBase();
    
    if (!knowledgeBase) {
      return NextResponse.json({
        success: false,
        message: 'Knowledge base not found. Try updating it first.',
        data: null
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge base retrieved successfully',
      data: knowledgeBase
    });
  } catch (error) {
    console.error('Failed to get knowledge base:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve knowledge base',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Update knowledge base manually
export async function POST() {
  try {
    await aiKB.updateKnowledgeBase();
    
    const updatedKB = await aiKB.getKnowledgeBase();
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge base updated successfully',
      data: {
        lastUpdated: updatedKB?.lastUpdated || new Date().toISOString(),
        sections: {
          fleet: !!updatedKB?.fleetInfo,
          company: !!updatedKB?.companyInfo,
          packages: !!updatedKB?.packagesInfo,
          services: !!updatedKB?.servicesInfo
        }
      }
    });
  } catch (error) {
    console.error('Failed to update knowledge base:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update knowledge base',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update specific knowledge base section
export async function PUT(request: Request) {
  try {
    const { section, content } = await request.json();
    
    if (!section || !content) {
      return NextResponse.json({
        success: false,
        message: 'Section and content are required'
      }, { status: 400 });
    }

    // For now, we'll just trigger a full update
    // In the future, this could be enhanced to update specific sections
    await aiKB.updateKnowledgeBase();
    
    return NextResponse.json({
      success: true,
      message: `Knowledge base section '${section}' updated successfully`
    });
  } catch (error) {
    console.error('Failed to update knowledge base section:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update knowledge base section',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
