const Chat = require('../models/chat.models');

exports.getChats = async (senderId, receiverId) => {
  try {
    return await Chat.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });/*.sort('timestamp');*/
    
  } catch (err) {
    console.error(err);
    throw new Error('Error retrieving messages');
  }
};

exports.getLastChat = async (senderId, receiverId) => {
  try {
    return await Chat.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    })
      .sort({ timestamp: -1 }) // sort messages by descending timestamp order
      .limit(1); // limit the result to only the last message
    
  } catch (err) {
    console.error(err);
    throw new Error('Error retrieving messages');
  }
};

