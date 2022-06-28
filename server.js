import { Server } from "socket.io";
import sql from "mssql/msnodesqlv8.js";

// SOCKET.IO

const io = new Server({
  cors: {
    origin: "http://localhost:8000",
  },
});

import client from "socket.io-client";
const socket = client("http://localhost:3000");

io.on("connection", (socket) => {
  socket.on("query", async (query) => {
    var result = await executeQuery(query);
    socket.emit("queryResult", result);
  });
});

io.listen(3000);

// DATABASE

var pool;
const conn = new sql.ConnectionPool({
  database: "Products",
  server: "DESKTOP-KUTAY\\SQLEXPRESS",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
  },
});
pool = await conn.connect();

async function executeQuery(query) {
  var queryResult;

  await pool
    .query(query)
    .then((result) => (queryResult = result))
    .catch((err) => console.log(err));

  return queryResult;
}
