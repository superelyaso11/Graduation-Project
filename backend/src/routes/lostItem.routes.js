const express = require('express')
const {
    createLostItem,
    getLostItems,
    getLostItemById,
    getMyLostItems
} = require('../controllers/lostItem.controller') // import controller functions
const { protect } = require('../middleware/auth.middleware') // JWT protection

const router = express.Router()

router.get('/', protect, getLostItems)              // GET /api/lost-items — all items (protected)
router.get('/my', protect, getMyLostItems)          // GET /api/lost-items/my — my items (protected)
router.get('/:id', protect, getLostItemById)        // GET /api/lost-items/:id — single item (protected)
router.post('/', protect, createLostItem)           // POST /api/lost-items — create item (protected)

module.exports = router