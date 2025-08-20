require("dotenv").config();
const OTPAuth = require("otpauth");

const createTotpInstance = (secret) => {
  return new OTPAuth.TOTP({
    issuer: "ACME",
    algorithm: "SHA1",
    digits: parseInt(process.env.OTP_DIGITS),
    period: parseInt(process.env.OTP_DURATION),
    secret: secret,
  });
};

const generateOTPForUser = async () => {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = createTotpInstance(secret);

  const otp = totp.generate();
  return { otp, otpSecret: secret.base32 };
};

const verifyOTPForUser = async (otp, otpSecret) => {
  const secret = OTPAuth.Secret.fromBase32(otpSecret);
  const totp = createTotpInstance(secret);

  const delta = totp.validate({ token: String(otp), window: 1 });
  return delta !== null;
};

module.exports = { generateOTPForUser, verifyOTPForUser };
