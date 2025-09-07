import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can import data for now (can be extended)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only Excel files (.xlsx, .xls) are supported' },
        { status: 400 }
      );
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      errors: [] as string[],
      total: jsonData.length
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      
      try {
        // Map Excel columns to our data structure
        // Flexible mapping to handle different column names
        const title = row['Title'] || row['title'] || row['TITLE'] || '';
        const category = row['Category'] || row['category'] || row['CATEGORY'] || 'Imported';
        const description = row['Description'] || row['description'] || row['DESCRIPTION'] || '';
        const value = parseFloat(row['Value'] || row['value'] || row['VALUE'] || '0') || 0;
        const status = row['Status'] || row['status'] || row['STATUS'] || 'active';
        
        // Extract metadata
        const metadata: Record<string, any> = {};
        if (row['Location'] || row['location']) metadata.location = row['Location'] || row['location'];
        if (row['Priority'] || row['priority']) metadata.priority = row['Priority'] || row['priority'];
        if (row['Tags'] || row['tags']) {
          const tags = String(row['Tags'] || row['tags']).split(',').map(t => t.trim()).filter(Boolean);
          if (tags.length > 0) metadata.tags = tags;
        }

        // Validate required fields
        if (!title || !description) {
          results.errors.push(`Row ${i + 1}: Title and Description are required`);
          continue;
        }

        // Create business data entry
        await db.createBusinessData({
          userId: user.id,
          title,
          category,
          description,
          value,
          status,
          metadata,
        });

        results.imported++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    }, { status: 200 });

  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}