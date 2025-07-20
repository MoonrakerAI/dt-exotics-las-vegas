import { NextRequest, NextResponse } from 'next/server'
import blogDB from '@/app/lib/blog-database'
import { verifyJWT } from '@/app/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    const updatedTag = await blogDB.updateTag(id, { name: body.name })
    
    if (updatedTag) {
      // Update post counts after tag update
      await blogDB.updateTagCounts()
      return NextResponse.json(updatedTag)
    } else {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Update tag error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const success = await blogDB.deleteTag(id)
    
    if (success) {
      // Update post counts after tag deletion
      await blogDB.updateTagCounts()
      return NextResponse.json({ message: 'Tag deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 