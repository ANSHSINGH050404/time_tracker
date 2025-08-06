'use client';

import { useState, useEffect } from 'react';
import { LiveTimer } from '@/components/timer/live-timer';
import { ManualEntry } from '@/components/timer/manual-entry';
import { TimeEntryList } from '@/components/time-entries/time-entry-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  name: string;
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
}

export function UserDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projectsRes, entriesRes] = await Promise.all([
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
      ]);

      if (projectsRes.ok && entriesRes.ok) {
        const projectsData = await projectsRes.json();
        const entriesData = await entriesRes.json();
        setProjects(projectsData.projects);
        setTimeEntries(entriesData.timeEntries);
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
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your work hours and manage your time efficiently
        </p>
      </div>

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">Live Timer</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timer">
          <LiveTimer projects={projects} onTimeEntryCreated={fetchData} />
        </TabsContent>
        
        <TabsContent value="manual">
          <ManualEntry projects={projects} onTimeEntryCreated={fetchData} />
        </TabsContent>
      </Tabs>

      <TimeEntryList 
        timeEntries={timeEntries} 
        projects={projects} 
        onRefresh={fetchData}
      />
    </div>
  );
}