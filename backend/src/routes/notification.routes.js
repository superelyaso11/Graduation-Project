const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();
const router = express.Router();

//Get /api/notifications - get all notifications for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20, //limit to last 20
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//Patch /api/notifications/read-all - mark all notifications as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
