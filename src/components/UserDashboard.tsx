'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataForm } from './DataForm';
import { DataTable } from './DataTable';
import { toast } from 'sonner';
import { BusinessData } from '@/lib/db';

export function UserDashboard() {
  const { user, logout } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<BusinessData | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch('/api/data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setBusinessData(result.data || []);
      } else {
        toast.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDataCreated = (newData: BusinessData) => {
    setBusinessData(prev => [newData, ...prev]);
    setShowForm(false);
    toast.success('Data entry created successfully');
  };

  const handleDataUpdated = (updatedData: BusinessData) => {
    setBusinessData(prev => prev.map(item => 
      item.id === updatedData.id ? updatedData : item
    ));
    setEditingData(null);
    setShowForm(false);
    toast.success('Data entry updated successfully');
  };

  const handleEdit = (data: BusinessData) => {
    setEditingData(data);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/data?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBusinessData(prev => prev.filter(item => item.id !== id));
        toast.success('Data entry deleted successfully');
      } else {
        toast.error('Failed to delete data entry');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data entry');
    }
  };

  const exportData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/excel/export?type=data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_business_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const stats = {
    total: businessData.length,
    active: businessData.filter(item => item.status === 'active').length,
    totalValue: businessData.reduce((sum, item) => sum + (item.value || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">My Data Entries</h2>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={exportData}>
              Export to Excel
            </Button>
            <Button 
              onClick={() => {
                setEditingData(null);
                setShowForm(true);
              }}
            >
              Add New Entry
            </Button>
          </div>
        </div>

        {/* Data form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingData ? 'Edit Entry' : 'New Data Entry'}</CardTitle>
              <CardDescription>
                {editingData ? 'Update your data entry' : 'Create a new business data entry'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataForm
                initialData={editingData}
                onSuccess={editingData ? handleDataUpdated : handleDataCreated}
                onCancel={() => {
                  setShowForm(false);
                  setEditingData(null);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Data table */}
        <DataTable
          data={businessData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          userRole={user?.role || 'user'}
        />
      </main>
    </div>
  );
}