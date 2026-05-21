const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

const prisma = new PrismaClient();
const router = express.Router();

//GET /api/security/items - get all found items that are held at security or matched
router.get(
  '/items',
  protect,
  allowRoles('SECURITY', 'ADMIN'),
  async (req, res) => {
    try {
      const items = await prisma.foundItem.findMany({
        where: {
          status: { in: ['ACTIVE', 'MATCHED', 'RESOLVED'] },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

//PATCH /api/security/items/:id/hold - mark an item as held at security
router.patch(
  '/items/:id/hold',
  protect,
  allowRoles('SECURITY', 'ADMIN'),
  async (req, res) => {
    const { id } = req.params;
    const { heldAt } = req.body; //location where items is held

    try {
      const item = await prisma.foundItem.update({
        where: { id: parseInt(id) },
        data: { heldAt: heldAt || 'Security Office' }, //update held location
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

//PATCH /api/security/items/:id/resolve - mark an item as resolved after handover
router.patch(
  '/items/:id/resolve',
  protect,
  allowRoles('SECURITY', 'ADMIN'),
  async (req, res) => {
    const { id } = req.params;

    try {
      const item = await prisma.foundItem.update({
        where: { id: parseInt(id) },
        data: { status: 'RESOLVED' }, //mark as resolved
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
