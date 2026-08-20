const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send OTP
async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
  };

  console.log("Attempting to send OTP email...");
  
  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", email);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    throw error;  // Re-throw the error to handle it in the caller
  }
}


//Send mail
async function sendConfirmationEmail(userName,userEmail,) {
  console.log("User Name:", userName);  // Check the value of userName
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Thank you for contacting us!",
    text: `Hello ${userName},\n\nWe have received your message and will get back to you shortly. Thank you for reaching out!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent successfully to:", userEmail);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    throw error;
  }
}




module.exports = { sendOTP,sendConfirmationEmail};



