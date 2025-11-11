const gameService = require('../services/gameService');
const { createUser, getUserById } = require('../services/firebaseService');

module.exports = (io, socket) => {
  /**
   * Create a new room
   * Data: { nickname, category, difficulty, isPrivate, maxPlayers }
   */
  socket.on('room:create', async (data) => {
    try {
      const { nickname, category, difficulty, isPrivate, maxPlayers } = data;

      // Create or get user in Firebase
      try {
        let user = await getUserById(socket.id);
        if (!user) {
          await createUser(socket.id, nickname);
        }
      } catch (error) {
        console.log('Creating new user:', nickname);
        await createUser(socket.id, nickname);
      }

      const room = gameService.createRoom(socket.id, nickname, {
        category,
        difficulty,
        isPrivate: isPrivate || false,
        maxPlayers: maxPlayers || 4
      });

      // Join socket room
      socket.join(room.roomId);

      // Send room created event
      socket.emit('room:created', {
        roomId: room.roomId,
        room: room.toJSON()
      });

      console.log(`📦 Room created: ${room.roomId} by ${nickname}`);

    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', {
        message: 'Failed to create room',
        code: 'ROOM_CREATE_ERROR'
      });
    }
  });

  /**
   * Join an existing room
   * Data: { roomId, nickname }
   */
  socket.on('room:join', async (data) => {
    try {
      const { roomId, nickname } = data;

      // Create or get user in Firebase
      try {
        let user = await getUserById(socket.id);
        if (!user) {
          await createUser(socket.id, nickname);
        }
      } catch (error) {
        console.log('Creating new user:', nickname);
        await createUser(socket.id, nickname);
      }

      const room = gameService.joinRoom(roomId, socket.id, nickname);

      // Join socket room
      socket.join(roomId);

      // Notify player who joined
      socket.emit('room:joined', {
        room: room.toJSON()
      });

      // Notify other players in the room
      socket.to(roomId).emit('room:player-joined', {
        player: {
          userId: socket.id,
          nickname,
          isReady: false
        }
      });

      console.log(`👤 ${nickname} joined room: ${roomId}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', {
        message: error.message || 'Failed to join room',
        code: 'ROOM_JOIN_ERROR'
      });
    }
  });

  /**
   * Leave room
   * Data: { roomId }
   */
  socket.on('room:leave', async (data) => {
    try {
      const { roomId } = data;

      const room = gameService.leaveRoom(roomId, socket.id);

      // Leave socket room
      socket.leave(roomId);

      // Notify other players
      if (room) {
        io.to(roomId).emit('room:player-left', {
          playerId: socket.id,
          room: room.toJSON()
        });
      }

      console.log(`🚪 Player left room: ${roomId}`);

    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', {
        message: 'Failed to leave room',
        code: 'ROOM_LEAVE_ERROR'
      });
    }
  });

  /**
   * Set player ready status
   * Data: { roomId, isReady }
   */
  socket.on('room:ready', async (data) => {
    try {
      const { roomId, isReady } = data;

      const room = gameService.setPlayerReady(roomId, socket.id, isReady);

      // Notify all players in the room
      io.to(roomId).emit('room:ready-status', {
        playerId: socket.id,
        isReady,
        allReady: room.areAllPlayersReady()
      });

      console.log(`✅ Player ready status: ${socket.id} - ${isReady}`);

    } catch (error) {
      console.error('Error setting ready status:', error);
      socket.emit('error', {
        message: 'Failed to set ready status',
        code: 'ROOM_READY_ERROR'
      });
    }
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    // Find rooms that this player is in and remove them
    const allRooms = gameService.getAllRooms();
    allRooms.forEach(roomData => {
      if (roomData.players[socket.id]) {
        try {
          const room = gameService.leaveRoom(roomData.roomId, socket.id);
          if (room) {
            io.to(roomData.roomId).emit('room:player-left', {
              playerId: socket.id,
              room: room.toJSON()
            });
          }
        } catch (error) {
          console.error('Error on disconnect cleanup:', error);
        }
      }
    });
  });
};
