const express = require('express')
const {
    createClaim,
    getMyClaims,
    getIncomingClaims,
    approveClaim,
    rejectClaim,
} = require('../controllers/claim.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/', protect, createClaim) //submit a claim
router.get('/my', protect, getMyClaims) //my submitted claims
router.get('/incoming', protect, getIncomingClaims) //claims on my found items
router.patch('/:id/approve', protect, approveClaim) //approve a claim
router.patch('/:id/reject', protect, rejectClaim) //reject a claim

module.exports = router