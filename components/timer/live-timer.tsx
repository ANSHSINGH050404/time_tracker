'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, Square } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface LiveTimerProps {
  projects: Project[];
  onTimeEntryCreated: () => void;
}

export function LiveTimer({ projects, onTimeEntryCreated }: LiveTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!selectedProject || !description.trim()) {
      alert('Please select a project and enter a description');
      return;
    }

    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          projectId: selectedProject,
          description,
          startTime: now.toISOString(),
          isTimerEntry: true,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setActiveEntryId(data.timeEntry.id);
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    if (!activeEntryId || !startTime) return;

    const endTime = new Date();
    setIsRunning(false);

    try {
      const response = await fetch(`/api/time-entries/${activeEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          endTime: endTime.toISOString(),
        }),
      });

      if (response.ok) {
        setStartTime(null);
        setElapsedTime(0);
        setActiveEntryId(null);
        setDescription('');
        setSelectedProject('');
        onTimeEntryCreated();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5" />
          <span>Live Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatTime(elapsedTime)}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              disabled={isRunning}
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop Timer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}