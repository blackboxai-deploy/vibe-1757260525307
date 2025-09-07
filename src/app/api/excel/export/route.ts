import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'data'; // 'data' or 'users'

    let exportData: any[] = [];
    let filename = '';

    if (type === 'users' && user.role === 'admin') {
      // Export users (admin only)
      const users = await db.getUsers();
      exportData = users.map(u => ({
        ID: u.id,
        Name: u.name,
        Email: u.email,
        Role: u.role,
        'Is Active': u.isActive ? 'Yes' : 'No',
        'Created At': new Date(u.createdAt).toLocaleDateString(),
        'Updated At': new Date(u.updatedAt).toLocaleDateString(),
      }));
      filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      // Export business data
      let businessData;
      if (user.role === 'admin') {
        businessData = await db.getBusinessData();
      } else {
        businessData = await db.getBusinessDataByUserId(user.id);
      }

      // Get user names for better readability
      const users = await db.getUsers();
      const userMap = users.reduce((acc, u) => {
        acc[u.id] = u.name;
        return acc;
      }, {} as Record<string, string>);

      exportData = businessData.map(item => ({
        ID: item.id,
        Title: item.title,
        Category: item.category,
        Description: item.description,
        Value: item.value,
        Status: item.status,
        'Created By': userMap[item.userId] || 'Unknown',
        'Created At': new Date(item.createdAt).toLocaleDateString(),
        'Updated At': new Date(item.updatedAt).toLocaleDateString(),
        'Location': item.metadata?.location || '',
        'Priority': item.metadata?.priority || '',
        'Tags': Array.isArray(item.metadata?.tags) ? item.metadata.tags.join(', ') : '',
      }));
      filename = `business_data_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    if (exportData.length === 0) {
      return NextResponse.json(
        { error: 'No data available for export' },
        { status: 404 }
      );
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const columnWidths: any[] = [];
    const headers = Object.keys(exportData[0]);
    
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...exportData.map(row => String(row[header] || '').length)
      );
      columnWidths[index] = { width: Math.min(maxLength + 2, 50) };
    });
    
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, type === 'users' ? 'Users' : 'Business Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file response
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}