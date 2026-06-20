import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcryptjs";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const myHash = await bcrypt.hash("123456", 10);
  await mongoose.connection.collection('otps').updateOne({ email: "raskarsumit159@gmail.com" }, { $set: { hashedOtp: myHash } });
  console.log("Replaced OTP with 123456");
  process.exit(0);
}
run().catch(console.error);
