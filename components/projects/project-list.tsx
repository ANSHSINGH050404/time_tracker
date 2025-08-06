'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';

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

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  // Debug logging
  console.log('ProjectList received projects:', projects);
  console.log('Projects length:', projects?.length);

  // Handle loading state
  if (!projects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects ({projects.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">No projects found</div>
            <div className="text-sm">Create your first project to get started!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              // Debug each project
              console.log('Rendering project:', project);
              
              return (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{project.name || 'Unnamed Project'}</h3>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {project._count?.timeEntries || 0} entries
                    </Badge>
                  </div>
                 
                  {project.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {project.description}
                    </p>
                  )}
                  
                  {project.projectMembers && project.projectMembers.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {project.projectMembers.map((member) => (
                          <Badge key={member.user.id} variant="secondary" className="text-xs">
                            {member.user.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">No members assigned</span>
                    </div>
                  )}
                  
                  {/* Debug info - remove in production */}
                  <div className="mt-2 text-xs text-gray-400 border-t pt-2">
                    ID: {project.id} | Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}