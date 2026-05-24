export default (io, userSocketMap, ACTIONS) => {
  const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
      (socketId) => {
        return {
          socketId,
          username: userSocketMap[socketId],
        };
      }
    );
  };

  io.on('connection', (socket) => {
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
      userSocketMap[socket.id] = username;
      socket.join(roomId);

      console.log(`${username} joined room ${roomId}`);

      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id,
        });
      });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
      console.log(`Code change in room ${roomId}:`, code);
      socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
      console.log(`Sync code to socket ${socketId}:`, code);
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code }); // Send CODE_CHANGE instead
    });

    socket.on('disconnecting', () => {
      const rooms = [...socket.rooms];

      rooms.forEach((roomId) => {
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      });

      console.log(`${userSocketMap[socket.id]} disconnected`);

      delete userSocketMap[socket.id];
      socket.leave();
    });
  });
};
