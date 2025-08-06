'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  description: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isActive: boolean;
  project: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Project {
  id: string;
  name: string;
}

interface TimeEntryListProps {
  timeEntries: TimeEntry[];
  projects: Project[];
  onRefresh: () => void;
  showUserColumn?: boolean;
}

export function TimeEntryList({ 
  timeEntries, 
  projects, 
  onRefresh, 
  showUserColumn = false 
}: TimeEntryListProps) {
  const [projectFilter, setProjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete time entry');
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('Failed to delete time entry');
    }
  };

  const filteredEntries = timeEntries.filter((entry) => {
    if (projectFilter && entry.project.id !== projectFilter) return false;
    if (dateFilter) {
      const entryDate = format(new Date(entry.startTime), 'yyyy-MM-dd');
      if (entryDate !== dateFilter) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Project',
      'Description',
      'Start Time',
      'End Time',
      'Duration (hours)',
      ...(showUserColumn ? ['User'] : [])
    ];

    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        `"${entry.project.name}"`,
        `"${entry.description}"`,
        `"${format(new Date(entry.startTime), 'yyyy-MM-dd HH:mm')}"`,
        entry.endTime ? `"${format(new Date(entry.endTime), 'yyyy-MM-dd HH:mm')}"` : '""',
        entry.duration ? (entry.duration / 60).toFixed(2) : '0',
        ...(showUserColumn ? [`"${entry.user?.name || 'N/A'}"`] : [])
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Entries</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
          {(projectFilter || dateFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProjectFilter('');
                setDateFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No time entries found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{entry.project.name}</Badge>
                      {entry.isActive && (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </div>
                    <p className="font-medium mb-2">{entry.description}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        Start: {format(new Date(entry.startTime), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {entry.endTime ? (
                        <div>
                          End: {format(new Date(entry.endTime), 'MMM dd, yyyy HH:mm')}
                        </div>
                      ) : (
                        <div className="text-green-600 dark:text-green-400">
                          Currently running...
                        </div>
                      )}
                      {showUserColumn && entry.user && (
                        <div>User: {entry.user.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatDuration(entry.duration)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}