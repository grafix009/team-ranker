
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static frontend
app.use(express.static(__dirname + '/public'));

// Dictionary of teams to their lists
const teamLists = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining a team
  socket.on('joinTeam', (team) => {
    socket.join(team);
    if (!teamLists[team]) teamLists[team] = [];

    // Send the current list to the user
    socket.emit('initList', teamLists[team]);
  });

  // Handle list reorder
  socket.on('updateList', ({ team, list }) => {
    if (!teamLists[team]) return;
    teamLists[team] = list;
    io.to(team).emit('listUpdated', list);
  });

  // Handle new item
  socket.on('addItem', ({ team, item }) => {
    if (!teamLists[team]) return;
    teamLists[team].push(item);
    io.to(team).emit('listUpdated', teamLists[team]);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
