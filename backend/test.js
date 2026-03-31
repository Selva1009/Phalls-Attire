const nodemailer = require('nodemailer');
require('dotenv').config();

// Create the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: 'johndoe@example.com', 
  subject: 'Test Email',
  text: 'This is a test email from Nodemailer!',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error sending email:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});

