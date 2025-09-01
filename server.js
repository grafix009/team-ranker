const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static("public"));

const dataFile = path.join(__dirname, "rankings.json");

// Load saved data if exists, otherwise default
let teamLists = {};
if (fs.existsSync(dataFile)) {
  teamLists = JSON.parse(fs.readFileSync(dataFile));
} else {
  teamLists = {
    TeamA: [],
    TeamB: []
  };
}

// Save data to JSON file
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(teamLists, null, 2));
}

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("update", teamLists);

  socket.on("addItem", (item) => {
    for (const team in teamLists) {
      teamLists[team].push(item);
    }
    saveData();
    io.emit("update", teamLists);
  });

  socket.on("editItem", ({ team, index, newText }) => {
    if (teamLists[team] && teamLists[team][index]) {
      teamLists[team][index] = newText;
      saveData();
      io.emit("update", teamLists);
    }
  });

  socket.on("deleteItem", ({ team, index }) => {
    if (teamLists[team]) {
      teamLists[team].splice(index, 1);
      saveData();
      io.emit("update", teamLists);
    }
  });

  socket.on("reorder", ({ team, newOrder }) => {
    teamLists[team] = newOrder;
    saveData();
    io.emit("update", teamLists);
  });
});

// Export rankings as CSV
app.get("/export/csv", (req, res) => {
  let csv = "Team,Rank,Item\n";
  for (const team in teamLists) {
    teamLists[team].forEach((item, index) => {
      csv += `${team},${index + 1},${item}\n`;
    });
  }
  res.header("Content-Type", "text/csv");
  res.attachment("rankings.csv");
  res.send(csv);
});

// Export rankings as Excel
const ExcelJS = require("exceljs");
app.get("/export/excel", async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rankings");

  worksheet.columns = [
    { header: "Team", key: "team", width: 20 },
    { header: "Rank", key: "rank", width: 10 },
    { header: "Item", key: "item", width: 30 }
  ];

  for (const team in teamLists) {
    teamLists[team].forEach((item, index) => {
      worksheet.addRow({ team, rank: index + 1, item });
    });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=rankings.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
