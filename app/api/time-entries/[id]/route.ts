import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (request, authUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId'); // For admin filtering

    let whereClause: any = {};

    // Regular users can only see their own entries
    if (authUser.role !== 'ADMIN') {
      whereClause.userId = authUser.userId;
    }

    // Admin can filter by userId
    if (authUser.role === 'ADMIN' && userId) {
      whereClause.userId = userId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error('Get time entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (request, authUser) => {
  try {
    const { projectId, description, startTime, endTime, isTimerEntry = false } = await request.json();

    if (!projectId || !description || !startTime) {
      return NextResponse.json(
        { error: 'Project, description, and start time are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this project
    if (authUser.role !== 'ADMIN') {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          userId: authUser.userId,
          projectId,
        },
      });

      if (!projectMember) {
        return NextResponse.json(
          { error: 'Access denied to this project' },
          { status: 403 }
        );
      }
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    let duration = null;

    if (end) {
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: authUser.userId,
        projectId,
        description,
        startTime: start,
        endTime: end,
        duration,
        isActive: isTimerEntry && !end,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});