const {PrismaClient} = require('@prisma/client')

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

module.exports = { createFoundItem, getFoundItems, getFoundItemById, getMyFoundItems}