const express = require('express')
const {
    createFoundItem,
    getFoundItems,
    getFoundItemById,
    getMyFoundItems,
} = require('../controllers/foundItem.controller')
const {protect} = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getFoundItems)         // GET /api/found-items
router.get('/my', protect, getMyFoundItems)     // GET /api/found-items/my
router.get('/:id', protect, getFoundItemById)   // GET /api/found-items/:id
router.post('/', protect, createFoundItem)      // POST /api/found-items

module.exports= router