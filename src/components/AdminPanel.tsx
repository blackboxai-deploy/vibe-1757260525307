'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataForm } from './DataForm';
import { DataTable } from './DataTable';
import { toast } from 'sonner';
import { BusinessData, User } from '@/lib/db';

export function AdminPanel() {
  const { user, logout } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDataForm, setShowDataForm] = useState(false);
  const [editingData, setEditingData] = useState<BusinessData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      // Fetch business data
      const dataResponse = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dataResponse.ok) {
        const dataResult = await dataResponse.json();
        setBusinessData(dataResult.data || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        setUsers(usersResult.users || []);
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
    setShowDataForm(false);
    toast.success('Data entry created successfully');
  };

  const handleDataUpdated = (updatedData: BusinessData) => {
    setBusinessData(prev => prev.map(item => 
      item.id === updatedData.id ? updatedData : item
    ));
    setEditingData(null);
    setShowDataForm(false);
    toast.success('Data entry updated successfully');
  };

  const handleEditData = (data: BusinessData) => {
    setEditingData(data);
    setShowDataForm(true);
    setActiveTab('data');
  };

  const handleDeleteData = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/data?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success('User deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isActive: !isActive } : u
        ));
        toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user status');
    }
  };

  const exportData = async (type: 'data' | 'users') => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/excel/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
      } else {
        toast.error(`Failed to export ${type}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Import completed: ${result.results.imported} entries imported`);
        if (result.results.errors.length > 0) {
          console.warn('Import errors:', result.results.errors);
        }
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    }

    // Reset file input
    event.target.value = '';
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalData: businessData.length,
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
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              <Badge variant="destructive">Admin</Badge>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="excel">Excel Tools</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-gray-500">
                    {stats.activeUsers} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Data Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalData}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.totalValue.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default">Online</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Data Entries</CardTitle>
                <CardDescription>Latest 5 data entries in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {businessData.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.value?.toLocaleString() || '0'}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Data Management</h2>
              <Button 
                onClick={() => {
                  setEditingData(null);
                  setShowDataForm(true);
                }}
              >
                Add New Entry
              </Button>
            </div>

            {showDataForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingData ? 'Edit Entry' : 'New Data Entry'}</CardTitle>
                  <CardDescription>
                    {editingData ? 'Update the data entry' : 'Create a new business data entry'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataForm
                    initialData={editingData}
                    onSuccess={editingData ? handleDataUpdated : handleDataCreated}
                    onCancel={() => {
                      setShowDataForm(false);
                      setEditingData(null);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <DataTable
              data={businessData}
              onEdit={handleEditData}
              onDelete={handleDeleteData}
              userRole="admin"
            />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                <CardDescription>{users.length} total users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Role</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Created</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        <tr key={userItem.id} className="border-b">
                          <td className="py-3">{userItem.name}</td>
                          <td className="py-3">{userItem.email}</td>
                          <td className="py-3">
                            <Badge variant={userItem.role === 'admin' ? 'destructive' : 'default'}>
                              {userItem.role}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant={userItem.isActive ? 'default' : 'secondary'}>
                              {userItem.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(userItem.id, userItem.isActive)}
                            >
                              {userItem.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {userItem.id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel Tools Tab */}
          <TabsContent value="excel" className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Excel Integration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Export system data to Excel files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => exportData('data')}
                    className="w-full"
                  >
                    Export Business Data
                  </Button>
                  <Button 
                    onClick={() => exportData('users')}
                    variant="outline"
                    className="w-full"
                  >
                    Export User Data
                  </Button>
                </CardContent>
              </Card>

              {/* Import Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Import Data</CardTitle>
                  <CardDescription>Import business data from Excel files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="excel-import">Choose Excel File</Label>
                    <Input
                      id="excel-import"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportData}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Supported columns: Title, Category, Description, Value, Status, Location, Priority, Tags</p>
                    <p>Title and Description are required fields.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}