const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes')
const LostItemRoutes = require('./routes/lostItem.routes')
const FoundItemRoutes = require('./routes/foundItem.routes')
const ClaimRoutes = require('./routes/claim.routes')
const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/lost-items', LostItemRoutes)
app.use('/api/found-items', FoundItemRoutes)
app.use('/api/claims', ClaimRoutes)
app.get('/', (req, res) => {
    res.json({message: 'Lost and Found API is running'})
})

module.exports = app