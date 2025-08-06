import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (request, authUser) => {
  try {
    let projects;

    if (authUser.role === 'ADMIN') {
      // Admin can see all projects
      projects = await prisma.project.findMany({
        include: {
          projectMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Users can only see projects they're assigned to
      projects = await prisma.project.findMany({
        where: {
          projectMembers: {
            some: {
              userId: authUser.userId,
            },
          },
        },
        include: {
          _count: {
            select: {
              timeEntries: {
                where: {
                  userId: authUser.userId,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireAdmin(async (request, authUser) => {
  try {
    const { name, description, userIds = [] } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        projectMembers: {
          create: userIds.map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});