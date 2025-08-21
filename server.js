
const express = require('express');
const http = require('http');
const path =require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));


// Dictionary of teams to their lists
const teamLists = {};

io.on('connection', (socket) => {
  console.log('A user connected');

 // Handle joining a team
 socket.on('joinTeam', (team) => {
    socket.join(team);

    // Initialize list by copying the first existing team's list
    if (!teamLists[team]) {
      const existingTeams = Object.keys(teamLists);
      if (existingTeams.length > 0) {
        const firstTeam = existingTeams[0];
        teamLists[team] = [...teamLists[firstTeam]];
      } else {
        teamLists[team] = [];
      }
    }

    // Send the current list to the user
    socket.emit('initList', {team, list:teamLists[team]});
  });

  // Handle list reorder
  socket.on('updateList', ({ team, list }) => {
    if (!teamLists[team]) return;
    teamLists[team] = list;
    io.to(team).emit('listUpdated', {team, list});
  });

  // Handle new item
socket.on('addItem', ({ item }) => {
  // Add new item to all existing teams
  for (const team of Object.keys(teamLists)) {
    teamLists[team].push(item);
    io.to(team).emit('listUpdated', { team, list: teamLists[team] });
  }
});

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server listening on port ${PORT}');
});
