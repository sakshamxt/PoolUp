import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: '"PoolUp Team" <no-reply@poolup.sakshamtyagi.me>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.email}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('There was an error sending the email. Try again later!');
  }
};

export default sendEmail;