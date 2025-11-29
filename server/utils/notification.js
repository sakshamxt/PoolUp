import logger from '../config/logger.js';

/**
 * Placeholder for Firebase Cloud Messaging (FCM).
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  // await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });

  logger.info(`[FCM-MOCK] Sending to ${fcmToken.substring(0, 10)}...`);
  logger.info(`[FCM-MOCK] Title: ${title} | Body: ${body}`);
};

/**
 * Notify a user about an event.
 * Fetches the user's FCM token from the DB helper if needed, 
 * but here we assume the controller passes the token or user object.
 */
export const notifyUser = async (user, title, message) => {
  if (user && user.fcmToken) {
    await sendPushNotification(user.fcmToken, title, message);
  }
};