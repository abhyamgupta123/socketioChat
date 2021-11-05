const path = require("path");
const http = require("https");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers, getAllUsers } = require("./utils/users");
const { log } = require("console");
const app = express();
const server = http.Server(app);
const io = socketio(server);

const botName = "Socket Bot"

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Run when a client connects.
io.on("connection", socket => {

    socket.on("joinRoom", ({ username, room }) => {

        const user = userJoin(socket.id, username, room);
        socket.join(user.room)

        // Welcome current user
        socket.emit("message", formatMessage(botName, "Welcome to SocketChat!"));

        // Broadcast when user connects.
        socket.broadcast.to(room).emit("message", formatMessage(botName, `${user.username} has joined the chat!`));

        console.log("on entry",getRoomUsers(user.room));
        // send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })

    // Runs when client disconnects.
    socket.on("disconnect", () => {

        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat!`))

            // send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    })

    // Listen for chatMessage.
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        console.log(socket.id);
        // console.log(msg);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
    })
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
