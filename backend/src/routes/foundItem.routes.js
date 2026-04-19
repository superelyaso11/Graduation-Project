const express = require('express')
const {
    createFoundItem,
    getFoundItems,
    getFoundItemById,
    getMyFoundItems,
    reportFoundForLostItem
} = require('../controllers/foundItem.controller')
const {protect} = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/my', protect, getMyFoundItems)                         // GET /api/found-items/my
router.get('/', protect, getFoundItems)                             // GET /api/found-items
router.get('/:id', protect, getFoundItemById)                       // GET /api/found-items/:id
router.post('/', protect, createFoundItem)                          // POST /api/found-items
router.post('/match/:lostItemId', protect, reportFoundForLostItem)  // POST /api/found-items/match/:lostItemId

module.exports= router