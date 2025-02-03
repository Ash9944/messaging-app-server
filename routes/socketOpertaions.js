import { Server } from "socket.io";
import { setSocketId ,get } from '../middleware/nodeCache.js';
import { validateSocketToken } from "../middleware/auth.js";
import { saveMessage } from "../services/messageServices.js";

export default async function iniatizeSocketConnection(server) {
    try {
        const users = {};
        const io = new Server(server, {
            "cors": {
                origin: "http://localhost:3000", // React Frontend
                methods: ["GET", "POST"]
            }
        });

        // Handle socket connections
        io.on("connection", (socket) => {
            try {
                const { token, userId } = socket.handshake.auth;
                // validateSocketToken(userId, token);
                setSocketId(userId, socket.id);

                console.log(`User Connected: ${socket.id}`);

                // Handle disconnection
                socket.on("oneToOneMessages", async (data) => {
                    await saveMessage(userId , data);
                    var reciptentId = get(data.to);
                    if(!reciptentId){
                        return ("Member not active");
                    }
                    io.to(reciptentId.socketId).emit("oneToOneMessages" , { from: userId});

                    io.to(socket.id).emit("oneToOneMessages" , { from: reciptentId.userId});
                });

                // Handle disconnection
                socket.on("disconnect", () => {
                    delete users[socket.id]
                    console.log("User Disconnected:", socket.id);
                });

            } catch (error) {
                console.error("Connection error:", error.message);
                socket.disconnect(); // Force disconnect on error
            }
        });

        return Promise.resolve(io);
    } catch (error) {
        throw new Error(error);
    }
}
