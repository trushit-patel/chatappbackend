const chatService = require('../services/chat.sercice');
const jwt = require('jsonwebtoken');

exports.getChats = async (req, res, next) => {
    
    const { receiverUsername } = req.params;
    try {
        return res.status(200).json({
            success: true,
            chats: await chatService.getChats(req.user.username, receiverUsername)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
};

exports.getLastChat = async (req, res, next) => {
    
    const { receiverUsername } = req.params;
    try {
        return res.status(200).json({
            success: true,
            chat: await chatService.getLastChat(req.user.username, receiverUsername)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
};