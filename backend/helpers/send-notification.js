const { notificationModel } = require("../models");
const { WebSocket } = require("ws");

// This clients map is defined solely here
// (If it’s also needed for WebSocket logic, you might want to share it via a dedicated module)
const clients = new Map();

/**
 * Send a notification to a specific user.
 * @param {number} userId - ID of the user to notify.
 * @param {number} senderId - ID of the sender.
 * @param {string} message - Notification message.
 * @param {string} type - Notification type.
 * @param {string} username .
 */
const sendNotification = async (
  username,
  userId,
  senderId,
  message,
  type,
  requestId,
) => {
  const notification = await notificationModel.create({
    userId,
    senderId,
    message,
    type,
    request_id: requestId,
  });

  // Send real-time notification if user is online
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        notificationId: notification.id,
        message: `${username} ${message}`,
        type,
        requestId,
      }),
    );
  }
};

module.exports = { sendNotification, clients };
