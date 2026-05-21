const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const LostItemRoutes = require('./routes/lostItem.routes');
const FoundItemRoutes = require('./routes/foundItem.routes');
const ClaimRoutes = require('./routes/claim.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const securityRoutes = require('./routes/security.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/lost-items', LostItemRoutes);
app.use('/api/found-items', FoundItemRoutes);
app.use('/api/claims', ClaimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/security', securityRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Lost and Found API is running' });
});

module.exports = app;
