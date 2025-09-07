'use client';

import { BusinessData } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps {
  data: BusinessData[];
  onEdit: (data: BusinessData) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export function DataTable({ data, onEdit, onDelete, userRole }: DataTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-lg font-medium mb-2">No data entries found</div>
            <p className="text-sm">Create your first data entry to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Entries</CardTitle>
        <CardDescription>
          {data.length} {data.length === 1 ? 'entry' : 'entries'} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.value ? `$${item.value.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.metadata?.priority ? (
                      <Badge variant={getPriorityBadgeVariant(item.metadata.priority)}>
                        {item.metadata.priority}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {item.metadata?.location || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Tags display for mobile */}
        <div className="mt-4 space-y-3 md:hidden">
          {data.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{item.title}</h4>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                  {item.value > 0 && (
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      ${item.value.toLocaleString()}
                    </span>
                  )}
                  {item.metadata?.priority && (
                    <Badge variant={getPriorityBadgeVariant(item.metadata.priority)} className="text-xs">
                      {item.metadata.priority}
                    </Badge>
                  )}
                  {item.metadata?.location && (
                    <span className="bg-green-100 px-2 py-1 rounded">
                      {item.metadata.location}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}