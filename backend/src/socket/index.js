// Socket.io event handlers
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Test event
    socket.emit('welcome', { message: 'Welcome to Trivia Multiplayer!' });

    // Room handlers
    require('./roomHandler')(io, socket);

    // Game handlers
    require('./gameHandler')(io, socket);

    // Match handlers will be added here
    // require('./matchHandler')(io, socket);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};
