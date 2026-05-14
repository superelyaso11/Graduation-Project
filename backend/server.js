const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

//Middleware to authenticate socket connections using JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token; //token sent from frontend

  if (!token) {
    return next(new Error('Authentication error - no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //verify token
    socket.userId = decoded.id; //attach user ID to socket
    socket.userRole = decoded.role; //attach user role to socket
    next(); //proceed with connection
  } catch (err) {
    return next(new Error('Authentication error - invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected via socket`);

  //join a personal room using ID so we can send targeted notifications
  socket.join(`user_${socket.userId}`);
  console.log(`User ${socket.userId} joined room user_${socket.userId}`);

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected: `);
  });
});

//initialize socket service with io instance
const socketService = require('./src/services/socket.service');
socketService.init(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
