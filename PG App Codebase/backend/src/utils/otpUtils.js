import crypto from "crypto";
import bcrypt from "bcryptjs";

// crypto.randomInt gives uniform distribution over [100000, 999999]
export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

export const verifyOTP = async (plainOtp, hashedOtp) => {
  return bcrypt.compare(plainOtp, hashedOtp);
};
