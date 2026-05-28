const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/dashboard/stats — get stats for logged-in user
router.get('/stats', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const [
      activeLostItems,
      activeFoundItems,
      matchesFound,
      resolvedItems,
      recentNotifications,
      recentActivity,
    ] = await Promise.all([
      // count active lost items
      prisma.lostItem.count({
        where: { userId, status: 'ACTIVE' },
      }),

      // count active found items
      prisma.foundItem.count({
        where: { userId, status: 'ACTIVE' },
      }),

      // count matches found for user's items
      prisma.match.count({
        where: {
          OR: [{ lostItem: { userId } }, { foundItem: { userId } }],
        },
      }),

      // count resolved items
      prisma.lostItem.count({
        where: { userId, status: 'RESOLVED' },
      }),

      // get last 5 notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // get recent activity — last 5 lost items + found items combined
      prisma.lostItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          category: true,
        },
      }),
    ]);

    res.json({
      stats: {
        activeLostItems,
        activeFoundItems,
        matchesFound,
        resolvedItems,
        totalActiveReports: activeLostItems + activeFoundItems,
      },
      recentNotifications,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
