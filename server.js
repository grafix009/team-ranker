
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const teamLists = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinTeam', (team) => {
    socket.join(team);
    if (!teamLists[team]) teamLists[team] = [];
    socket.emit('initList', teamLists[team]);
  });

  socket.on('updateList', ({ team, list }) => {
    if (!teamLists[team]) return;
    teamLists[team] = list;
    io.to(team).emit('listUpdated', list);
  });

  socket.on('addItem', ({ team, item }) => {
    if (!teamLists[team]) return;
    teamLists[team].push(item);
    io.to(team).emit('listUpdated', teamLists[team]);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
