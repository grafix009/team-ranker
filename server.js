import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let teamLists = {}; // { teamName: [items...] }

app.use(express.static(path.join(__dirname, "public")));

// Export all team lists as JSON
app.get("/export", (req, res) => {
  res.json(teamLists);
});

io.on("connection", (socket) => {
  console.log("a user connected");

  // Join a team
  socket.on("joinTeam", (team) => {
    socket.join(team);
    if (!teamLists[team]) teamLists[team] = [];

    socket.emit("initList", { team, list: teamLists[team] });
  });

  // Update a team’s list (reorder, edit, delete)
  socket.on("updateList", ({ team, list }) => {
    teamLists[team] = list;
    io.to(team).emit("listUpdated", { team, list });
  });

  // Add item to ALL teams at once
  socket.on("addItem", ({ item }) => {
    for (const team of Object.keys(teamLists)) {
      teamLists[team].push(item);
      io.to(team).emit("listUpdated", { team, list: teamLists[team] });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
