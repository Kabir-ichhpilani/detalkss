import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String },
    gender: String,
    problem: String,
    condition: String,
    isLive: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
