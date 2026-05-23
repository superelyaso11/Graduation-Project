const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

const prisma = new PrismaClient();
const router = new express.Router();

//GET /api/admin/stats - platform statistics
router.get('/stats', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalLostItems,
      totalFoundItems,
      totalMatches,
      resolvedItems,
      activeItems,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lostItem.count(),
      prisma.foundItem.count(),
      prisma.match.count(),
      prisma.lostItem.count({ where: { status: 'RESOLVED' } }),
      prisma.lostItem.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      totalUsers,
      totalLostItems,
      totalFoundItems,
      totalMatches,
      resolvedItems,
      activeItems,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//GET /api/admin/users -get all users
router.get('/users', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        _count: {
          select: {
            lostItems: true,
            foundItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//PATCH /api/admin/users/:id/role - change a user's role
router.patch(
  '/users/:id/role',
  protect,
  allowRoles('ADMIN'),
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; //new role

    try {
      if (parseInt(id) === req.user.id) {
        return res
          .status(400)
          .json({ message: 'You cannot change your own role' });
      }

      const validRoles = ['STUDENT', 'SECURITY', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'invalid role' });
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

//GET /api/admin/reports - get all lost and found items
router.get('/reports', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const [lostItems, foundItems] = await Promise.all([
      prisma.lostItem.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.foundItem.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ lostItems, foundItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//DELETE /api/admin/lost/:id - delete a lost item report
router.delete('/lost/:id', protect, allowRoles('ADMIN'), async (req, res) => {
  const itemId = parseInt(req.params.id); //renamed to avoid any scope issues

  try {
    // find related matches first
    const matches = await prisma.match.findMany({
      where: { lostItemId: itemId },
    });
    const foundItemIds = matches.map((m) => m.foundItemId);

    //delete claims on this lost item
    await prisma.claim.deleteMany({ where: { lostItemId: itemId } });
    //delete claims on related found items only if there are any
    if (foundItemIds.length > 0) {
      await prisma.claim.deleteMany({
        where: { foundItemId: { in: foundItemIds } },
      });
    }
    //delete matches
    await prisma.match.deleteMany({ where: { lostItemId: itemId } });
    //delete the lost item
    await prisma.lostItem.delete({ where: { id: itemId } });
    res.json({ message: 'Lost item deleted successfully' });
  } catch (error) {
    console.error('Delete lost error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//DELETE /api/admin/found/:id — delete a found item report
router.delete('/found/:id', protect, allowRoles('ADMIN'), async (req, res) => {
  const itemId = parseInt(req.params.id);
  try {
    const matches = await prisma.match.findMany({
      where: { foundItemId: itemId },
    });

    const lostItemIds = matches.map((m) => m.lostItemId);

    await prisma.claim.deleteMany({ where: { foundItemId: itemId } });

    if (lostItemIds.length > 0) {
      await prisma.claim.deleteMany({
        where: { lostItemId: { in: lostItemIds } },
      });
    }

    await prisma.match.deleteMany({ where: { foundItemId: itemId } });

    await prisma.foundItem.delete({ where: { id: itemId } });

    res.json({ message: 'Found item deleted successfully' });
  } catch (error) {
    console.error('Delete found error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//GET /api/admin/expired - get all expired items pending donation
router.get('/expired', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const expiredItems = await prisma.lostItem.findMany({
      where: { status: 'EXPIRED' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(expiredItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//PATCH /api/admin/lost/:id/donate - mark expired item as donated
router.patch(
  '/lost/:id/donate',
  protect,
  allowRoles('ADMIN'),
  async (req, res) => {
    try {
      const item = await prisma.lostItem.findMany({
        where: { id: parseInt(req.params.id) },
        data: { status: 'DONATED' },
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
