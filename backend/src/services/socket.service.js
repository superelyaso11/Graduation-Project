let io; //will hold the io instance

//called once from server.js to initialize
const init = (ioInstance) => {
  io = ioInstance;
};

//emit a notification to a specific user's room
const notifyUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }
  io.to(`user_${userId}`).emit(event, data); //send to user's personal room
  console.log(`Notified user ${userId} with event: ${event}`);
};

module.exports = { init, notifyUser };
