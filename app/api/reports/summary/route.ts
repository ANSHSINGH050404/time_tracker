import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAdmin(async (request, authUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {
      endTime: { not: null },
    };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    // Get total hours by user
    const userSummary = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: whereClause,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    const userSummaryWithDetails = await Promise.all(
      userSummary.map(async (summary) => {
        const user = await prisma.user.findUnique({
          where: { id: summary.userId },
          select: { id: true, name: true, email: true },
        });
        return {
          user,
          totalMinutes: summary._sum.duration || 0,
          totalHours: Math.round((summary._sum.duration || 0) / 60 * 100) / 100,
          entryCount: summary._count.id,
        };
      })
    );

    // Get total hours by project
    const projectSummary = await prisma.timeEntry.groupBy({
      by: ['projectId'],
      where: whereClause,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    const projectSummaryWithDetails = await Promise.all(
      projectSummary.map(async (summary) => {
        const project = await prisma.project.findUnique({
          where: { id: summary.projectId },
          select: { id: true, name: true, description: true },
        });
        return {
          project,
          totalMinutes: summary._sum.duration || 0,
          totalHours: Math.round((summary._sum.duration || 0) / 60 * 100) / 100,
          entryCount: summary._count.id,
        };
      })
    );

    return NextResponse.json({
      userSummary: userSummaryWithDetails,
      projectSummary: projectSummaryWithDetails,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});