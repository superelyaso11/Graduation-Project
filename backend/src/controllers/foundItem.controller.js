const {PrismaClient} = require('@prisma/client')
const {matchNewFoundItem} = require('../services/matching.service')

const prisma = new PrismaClient()

// POST /api/found-items — create a new found item report
const createFoundItem = async (req, res) => {
    const {title,description, category, location, dateFound, imageUrl, heldAt} = req.body
    const userId = req.user.id

    try {
        if (!title || !description || !category || !location || !dateFound){
            return res.status(400).json({message: 'All fields are required'})
    }

    const foundItem =  await prisma.foundItem.create({
        data: {
            title,
            description,
            category,
            location,
            dateFound: new Date(dateFound),
            imageUrl: imageUrl || null,
            heldAt: heldAt || null,
            userId,
        },
    })

    matchNewFoundItem(foundItem).catch(err => console.error('Background matching error:', err.message))

    res.status(201).json(foundItem)
} catch (error) {
    res.status(500).json({message: 'Server error', error: error.message})
    }
}

const getFoundItems = async (req, res) => {
    const {category, location} = req.query //optional filters

    try{
        const foundItems =await prisma.foundItem.findMany({
            where: {
                ...(category && {category}),
                ...(location  && {location: {contains: location, mode: 'insensitive'}
                }),
            },
            include: {
                user: {select: {id: true, name: true, points: true}}
            },
            orderBy: {createdAt: 'desc'}
        })

        res.json(foundItems)
    } catch (error) {
        res.status(500).json({message: 'Server error', error: error.message})
    }
}

// GET /api/found-items/:id — get single found item
const getFoundItemById = async (req, res) => {
    const {id} = req.params

    try {
        const foundItem = await prisma.foundItem.findUnique({
            where: {id: parseInt(id)},
            include: {
                user: {select: {id: true, name: true, points: true}}
            },
        })

        if (!foundItem){
            return res.status(404).json({message: 'Found item not found'})
        }

        res.json(foundItem)
    } catch (error) {
        res.status(500).json({message: 'Server error', error: error.message})
    }
}

// GET /api/found-items/my — get all found items reported by logged-in user
const getMyFoundItems = async (req, res) => {
    const userId = req.user.id

    try {
        const foundItems = await prisma.foundItem.findMany({
            where: {userId},
            orderBy: {createdAt: 'desc'},
        })

        res.json(foundItems)
    } catch (error) {
        res.status(500).json({message: 'Server error', error: error.message})
    }
}
// POST /api/found-items/match/:lostItemId
// Creates a found report directly linked to a lost item and triggers matching
const reportFoundForLostItem = async (req, res) => {
  const { lostItemId } = req.params                    // the lost item being matched
  const { location, dateFound, description, heldAt } = req.body
  const userId = req.user.id                           // logged-in user

  try {
    // get the lost item to copy its details
    const lostItem = await prisma.lostItem.findUnique({
      where: { id: parseInt(lostItemId) }
    })

    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' })
    }

    if (lostItem.userId === userId) {                  // can't claim your own item
      return res.status(400).json({ message: 'You cannot report finding your own item' })
    }

    // create the found item using the lost item's details
    const foundItem = await prisma.foundItem.create({
      data: {
        title: lostItem.title,                         // copy title from lost item
        description: description || lostItem.description,
        category: lostItem.category,                   // copy category
        location,
        dateFound: new Date(dateFound),
        heldAt: heldAt || null,
        userId,
      },
    })

    // create a match between the two items with high confidence score
    const match = await prisma.match.create({
      data: {
        lostItemId: parseInt(lostItemId),
        foundItemId: foundItem.id,
        score: 0.95,                                   // high score since user explicitly matched
        status: 'PENDING',
      },
    })

    // update both items status to MATCHED
    await prisma.lostItem.update({
      where: { id: parseInt(lostItemId) },
      data: { status: 'MATCHED' },
    })

    await prisma.foundItem.update({
      where: { id: foundItem.id },
      data: { status: 'MATCHED' },
    })

    // create notification for the lost item owner
    await prisma.notification.create({
      data: {
        userId: lostItem.userId,                       // notify the person who lost the item
        message: `Someone found your ${lostItem.title}! Check your matches.`,
      },
    })

    res.status(201).json({ foundItem, match })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { createFoundItem, getFoundItems, getFoundItemById, getMyFoundItems, reportFoundForLostItem}