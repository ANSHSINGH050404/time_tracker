'use client';

import { useState, useEffect } from 'react';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectList } from '@/components/projects/project-list';
import { TimeEntryList } from '@/components/time-entries/time-entry-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, FolderOpen, TrendingUp } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  projectMembers?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    timeEntries: number;
  };
}

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
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface SummaryData {
  userSummary: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    totalHours: number;
    entryCount: number;
  }>;
  projectSummary: Array<{
    project: {
      id: string;
      name: string;
    };
    totalHours: number;
    entryCount: number;
  }>;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes, entriesRes, summaryRes] = await Promise.all([
        fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }),
        fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }),
        fetch('/api/time-entries', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }),
        fetch('/api/reports/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }),
      ]);

      if (usersRes.ok && projectsRes.ok && entriesRes.ok && summaryRes.ok) {
        const usersData = await usersRes.json();
        const projectsData = await projectsRes.json();
        const entriesData = await entriesRes.json();
        const summaryData = await summaryRes.json();
        
        setUsers(usersData.users);
        setProjects(projectsData.projects);
        setTimeEntries(entriesData.timeEntries);
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.filter(u => u.role === 'USER').length;
  const totalProjects = projects.length;
  const totalEntries = timeEntries.length;
  const totalHours = summary?.userSummary.reduce((acc, u) => acc + u.totalHours, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage projects, users, and track overall progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalProjects}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{totalEntries}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="create">Create Project</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects">
          <ProjectList projects={projects} />
        </TabsContent>
        
        <TabsContent value="create">
          <ProjectForm users={users} onProjectCreated={fetchData} />
        </TabsContent>
        
        <TabsContent value="entries">
          <TimeEntryList 
            timeEntries={timeEntries} 
            projects={projects} 
            onRefresh={fetchData}
            showUserColumn={true}
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hours by User</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.userSummary.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {summary?.userSummary.map((user) => (
                      <div key={user.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.entryCount} entries
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {user.totalHours.toFixed(1)}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hours by Project</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.projectSummary.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {summary?.projectSummary.map((project) => (
                      <div key={project.project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{project.project.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.entryCount} entries
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {project.totalHours.toFixed(1)}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}