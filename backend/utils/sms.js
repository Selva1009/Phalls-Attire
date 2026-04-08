const https = require("https");

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const buildMobileNumber = (value) => {
  const digits = normalizeDigits(value);
  if (digits.length === 10) {
    const countryCode = process.env.MSG91_COUNTRY_CODE || "91";
    return `${countryCode}${digits}`;
  }
  return digits;
};

const buildMessage = (otp) => {
  const template =
    process.env.MSG91_OTP_MESSAGE || "Your verification code is ##OTP##.";
  return template.includes("##OTP##") ? template : `${template} ##OTP##`;
};

const sendSmsOtp = ({ phoneNumber, otp }) =>
  new Promise((resolve, reject) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "SMSIND";

    if (!authKey) {
      return reject(new Error("MSG91_AUTH_KEY is missing"));
    }

    const mobile = buildMobileNumber(phoneNumber);
    const message = buildMessage(otp);
    const otpExpiry = process.env.MSG91_OTP_EXPIRY_MINUTES || "5";
    const otpLength = process.env.MSG91_OTP_LENGTH || String(String(otp).length);

    const params = new URLSearchParams({
      authkey: authKey,
      mobile,
      message,
      sender: senderId,
      otp: String(otp),
      otp_expiry: String(otpExpiry),
      otp_length: String(otpLength),
    });

    const url = `https://api.msg91.com/api/sendotp.php?${params.toString()}`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              resolve({ raw: data });
            }
            return;
          }

          const err = new Error(`MSG91 request failed with status ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.response = data;
          reject(err);
        });
      })
      .on("error", reject);
  });

module.exports = { sendSmsOtp };
