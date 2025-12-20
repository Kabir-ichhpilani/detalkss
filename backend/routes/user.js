import express from "express";
import { clerkClient, requireAuth } from "@clerk/express";
import User from "../models/userModel.js";

const router = express.Router();

router.get("/", requireAuth(), async (req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.auth.userId);
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/save", async (req, res) => {
    try {
        const { clerkId, email, username, gender, problem, condition } = req.body;

        const user = await User.findOneAndUpdate(
            { clerkId },
            {
                clerkId,
                email,
                username,
                gender,
                problem,
                condition,
            },
            { new: true, upsert: true }
        );

        return res.json({ success: true, user });
    } catch (err) {
        console.log("Backend ERROR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
