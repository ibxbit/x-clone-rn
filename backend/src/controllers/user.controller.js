import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

export const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, { new: true });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    console.log(`[SyncUser] Attempting to sync user with ClerkId: ${userId}`); // Added log 1

    // check if user already exists in mongodb
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
        console.log(`[SyncUser] User ${userId} already exists in DB.`); // Added log 2
        return res.status(200).json({ user: existingUser, message: "User already exists" });
    }

    // create new user from Clerk data
    console.log(`[SyncUser] User ${userId} not found in DB. Fetching from Clerk...`); // Added log 3
    let clerkUser;
    try {
        clerkUser = await clerkClient.users.getUser(userId);
        console.log(`[SyncUser] Successfully fetched Clerk user: ${clerkUser.id}`); // Added log 4
    } catch (clerkError) {
        console.error(`[SyncUser] ERROR fetching user ${userId} from Clerk:`, clerkError); // Added log 5
        // Re-throw or handle specific error to trace
        if (clerkError.response) { // Axios error from Clerk API
            console.error("Clerk API response data:", clerkError.response.data);
            console.error("Clerk API response status:", clerkError.response.status);
        }
        throw new Error(`Failed to fetch user from Clerk: ${clerkError.message}`); // Re-throw to be caught by asyncHandler
    }

    // Basic validation for Clerk data before proceeding
    if (!clerkUser || !clerkUser.emailAddresses || clerkUser.emailAddresses.length === 0) {
        console.error(`[SyncUser] Clerk user data incomplete for ${userId}. Missing email.`); // Added log 6
        return res.status(400).json({ error: "Clerk user data incomplete for sync" });
    }

    const userData = {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
        profilePicture: clerkUser.imageUrl || "",
    };
    console.log("[SyncUser] Prepared userData for DB:", userData); // Added log 7

    let user;
    try {
        user = await User.create(userData);
        console.log("[SyncUser] User created successfully in MongoDB:", user._id); // Added log 8
    } catch (dbError) {
        console.error("[SyncUser] ERROR creating user in MongoDB:", dbError); // Added log 9
        if (dbError.name === 'ValidationError') {
            console.error("MongoDB Validation Error details:", dbError.errors);
        } else if (dbError.code === 11000) { // Duplicate key error
            console.error("MongoDB Duplicate Key Error (likely username or email unique constraint)");
        }
        throw new Error(`Failed to create user in DB: ${dbError.message}`); // Re-throw
    }

    res.status(201).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
});

export const followUser = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { targetUserId } = req.params;

    if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

    const currentUser = await User.findOne({ clerkId: userId });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
        // unfollow
        await User.findByIdAndUpdate(currentUser._id, {
            $pull: { following: targetUserId },
        });
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { followers: currentUser._id },
        });
    } else {
        // follow
        await User.findByIdAndUpdate(currentUser._id, {
            $push: { following: targetUserId },
        });
        await User.findByIdAndUpdate(targetUserId, {
            $push: { followers: currentUser._id },
        });

        // create notification
        await Notification.create({
            from: currentUser._id,
            to: targetUserId,
            type: "follow",
        });
    }

    res.status(200).json({
        message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
    });
});