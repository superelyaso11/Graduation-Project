const { PrismaClient } = require('@prisma/client');
const { matchNewLostItem } = require('../services/matching.service');

const prisma = new PrismaClient();

// POST /api/lost-items — create a new lost item report
const createLostItem = async (req, res) => {
  const { title, description, category, location, dateLost, imageUrl } =
    req.body;
  const userId = req.user.id; //get logged-in user's ID from JWT token (set by auth middleware)

  try {
    if (!title || !description || !category || !location || !dateLost) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // the lost item in the database
    const lostItem = await prisma.lostItem.create({
      data: {
        title,
        description,
        category,
        location,
        dateLost: new Date(dateLost), // convert string to Date object
        imageUrl: imageUrl || null, // optional field
        userId, // link to the logged-in user
      },
    });

    matchNewLostItem(lostItem).catch((err) =>
      console.error('Background matching error:', err.message)
    );

    res.status(201).json(lostItem); // 201 = Created, return the new item
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/lost-items — get all lost items
const getLostItems = async (req, res) => {
  const { category, location } = req.query; // optional filters

  try {
    const lostItems = await prisma.lostItem.findMany({
      where: {
        ...(category && { category }), // if category filter is provided
        ...(location && {
          location: { contains: location, mode: 'insensitive' },
        }), // if location filter is provided
      },
      include: {
        user: { select: { id: true, name: true, points: true } }, // include user basic info
      },
      orderBy: { createdAt: 'desc' }, // newest first
    });
    res.json(lostItems);
  } catch (error) {
    res.status(500).json({ message: 'server error', error: error.message });
  }
};

// GET /api/lost-items/:id — get a single lost item by ID
const getLostItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const lostItem = await prisma.lostItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, name: true, points: true } }, // include user basic info
        matches: true,
      },
    });
    if (!lostItem) {
      return res.status(404).json({ message: 'lost item not found' });
    }

    res.json(lostItem);
  } catch (error) {
    res.status(500).json({ message: 'server error', error: error.message });
  }
};

// GET /api/lost-items/my — get all lost items reported by the logged-in user
const getMyLostItems = async (req, res) => {
  const userId = req.user.id; // from JWT token

  try {
    const lostItems = await prisma.lostItem.findMany({
      where: { userId }, // only this user's items
      orderBy: { createdAt: 'desc' },
    });

    res.json(lostItems);
  } catch (error) {
    res.status(500).json({ message: 'server error', error: error.message });
  }
};

module.exports = {
  createLostItem,
  getLostItems,
  getLostItemById,
  getMyLostItems,
};
