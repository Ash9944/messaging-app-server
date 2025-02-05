import { Server } from "socket.io";
import { setSocketId, get } from '../middleware/nodeCache.js';
import { validateSocketToken } from "../middleware/auth.js";
import { saveMessage } from "../services/messageServices.js";
import groupDao from '../dao/groupChatDao.js';

export default async function iniatizeSocketConnection(server) {
    try {
        const users = {};
        const io = new Server(server, {
            "cors": {
                origin: "http://localhost:3000", // React Frontend
                methods: ["GET", "POST"]
            },
            maxHttpBufferSize: 10e6, // Allow 10MB messages
        });

        // Handle socket connections
        io.on("connection", async (socket) => {
            try {
                const { token, userId } = socket.handshake.auth;
                await validateSocketToken(userId, token);
                setSocketId(userId, socket.id);

                console.log(`User Connected: ${socket.id}`);

                // Handle disconnection
                socket.on("oneToOneMessages", async (data) => {
                    await saveMessage(userId, data);
                    var reciptentId = get(data.to);

                    if (data.groupId) {
                        io.in(data.groupId).emit("oneToOneMessages", { from: data.to, groupId: data.groupId });
                    }

                    if (!data.groupId) {
                        reciptentId ? io.to(reciptentId?.socketId).emit("oneToOneMessages", { from: userId }) : null;
                        io.to(socket.id).emit("oneToOneMessages", { from: data.to });
                    }
                });

                socket.on("joinGroup", async (userId) => {
                    const groups = await groupDao.getBy({ members: userId.userId });
                    if (!groups || !groups.length) {
                        return;
                    }

                    for (let group of groups) {
                        if (!group.groupId) continue;
                        socket.join(group.groupId);
                    }
                });

                // Handle disconnection
                socket.on("disconnect", () => {
                    delete users[socket.id]
                    console.log("User Disconnected:", socket.id);
                });

                socket.on("groupChanges", async (data) => {
                    var reciptentId = get(data.groupId);
                    const group = await groupDao.getOne({ groupId: data.groupId });
                    if (!group) {
                        io.to(data.groupId).emit("groupChanges");
                        return;
                    }

                    socket.join(group.groupId);

                    for (let member of group.members) {
                        var reciptentId = get(member);
                        io.to(reciptentId?.socketId).emit("groupChanges");
                    }

                });

            } catch (error) {
                console.error("Connection error:", error.message);
                io.to(socket.id).emit("error", error);
            }
        });

        return Promise.resolve(io);
    } catch (error) {
        return Promise.reject(error);
    }
}
