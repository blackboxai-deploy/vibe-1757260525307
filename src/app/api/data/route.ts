import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch business data
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can see all data, users only see their own
    let businessData;
    if (user.role === 'admin') {
      businessData = await db.getBusinessData();
    } else {
      businessData = await db.getBusinessDataByUserId(user.id);
    }

    return NextResponse.json({ data: businessData }, { status: 200 });
  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new business data entry
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, description, value, status, metadata } = body;

    // Validate required fields
    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Title, category, and description are required' },
        { status: 400 }
      );
    }

    // Create new data entry
    const newEntry = await db.createBusinessData({
      userId: user.id,
      title,
      category,
      description,
      value: value || 0,
      status: status || 'active',
      metadata: metadata || {},
    });

    return NextResponse.json({ data: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Create data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update business data entry
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, category, description, value, status, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Data entry ID is required' },
        { status: 400 }
      );
    }

    // Check if data entry exists and user has permission
    const existingEntry = await db.getBusinessDataById(id);
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Data entry not found' },
        { status: 404 }
      );
    }

    // Users can only edit their own data, admins can edit all
    if (user.role !== 'admin' && existingEntry.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the entry
    const updatedEntry = await db.updateBusinessData(id, {
      title,
      category,
      description,
      value,
      status,
      metadata,
    });

    return NextResponse.json({ data: updatedEntry }, { status: 200 });
  } catch (error) {
    console.error('Update data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete business data entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Data entry ID is required' },
        { status: 400 }
      );
    }

    // Check if data entry exists and user has permission
    const existingEntry = await db.getBusinessDataById(id);
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Data entry not found' },
        { status: 404 }
      );
    }

    // Users can only delete their own data, admins can delete all
    if (user.role !== 'admin' && existingEntry.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the entry
    const deleted = await db.deleteBusinessData(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete data entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Data entry deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}