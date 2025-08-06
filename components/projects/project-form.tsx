'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectFormProps {
  users: User[];
  onProjectCreated: () => void;
}

export function ProjectForm({ users, onProjectCreated }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Project name is required');
      return;
    }

    setLoading(true);
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include', // Include cookies for HTTP-only auth
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          userIds: selectedUsers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setName('');
        setDescription('');
        setSelectedUsers([]);
        alert('Project created successfully!');
        onProjectCreated();
      } else {
        console.error('API Error:', data);
        alert(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fixed: Use the checked parameter from onCheckedChange
  const handleUserToggle = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      if (checked) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  const regularUsers = users.filter(user => user.role === 'USER');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Create New Project</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div>
            <Label>Assign Users ({selectedUsers.length} selected)</Label>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {regularUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={user.id}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={user.id} 
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {user.name} ({user.email})
                  </Label>
                </div>
              ))}
              {regularUsers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No users available to assign
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading || !name.trim()} className="w-full">
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}