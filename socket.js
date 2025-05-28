const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('./app/models/chat.models');
const userService = require('./app/services/user.service');
const userStatusService = require('./app/services/status.service');
const jwtSecret = require('./config/jwt.config.js').secret;

const connectedUsers = new Map();

// Initialize socket.io instance
const socketio = socketIO({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

function handleClientMessage(socket, data) {
    userService.getByUsername(data.reciever).then(userExists => {
        if (userExists) {
            if (connectedUsers.has(data.reciever)) {
                connectedUsers.get(data.reciever).emit('client-msg', {
                    message: data.message,
                    sender: socket.decoded.username,
                    timestamp: data.timestamp
                });
            }

            const newChat = new Chat({
                sender: socket.decoded.username,
                receiver: data.reciever,
                message: data.message,
                timestamp: new Date()
            });

            return newChat.save();
        } else {
            socket.emit('404', { message: 'no such user' });
        }
    }).catch(err => {
        console.error('Error in handleClientMessage:', err);
        socket.emit('500', { message: 'Internal server error' });
    });
}

function handleFileTransfer(socket, data) {
    if (connectedUsers.has(data.reciever)) {
        connectedUsers.get(data.reciever).emit('file', {
            file: data.file,
            sender: socket.decoded.username,
            timestamp: data.timestamp
        });
    } else {
        socket.emit('404', { message: 'no such user' });
    }
}

async function handleDisconnect(socket) {
    console.log('Socket disconnected:', socket.decoded.username);
    connectedUsers.delete(String(socket.decoded.username));
    await broadcastUserStatusChange(socket.decoded.username, false);
}

async function broadcastUserStatusChange(username, status) {
    const user = await userService.getByUsername(username);
    if (user) {
        const updatedUser = await userStatusService.updateUserStatus(user, status);
        socketio.emit('user-status-change', updatedUser);
    }
}

socketio.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.decoded = decoded;
        next();
    });
});

socketio.on('connection', (socket) => {
    console.log('Socket connected:', socket.decoded.username);
    connectedUsers.set(String(socket.decoded.username), socket);
    broadcastUserStatusChange(socket.decoded.username, true);

    socket.emit('acknowledgement', "you are now connected");

    socket.on('client-msg', (data) => handleClientMessage(socket, data));
    socket.on('file', (data) => handleFileTransfer(socket, data));
    socket.on('disconnect', () => handleDisconnect(socket));
});

module.exports = {
    socketio,
    handleClientMessage,
    handleDisconnect,
    handleFileTransfer,
    broadcastUserStatusChange,
};
