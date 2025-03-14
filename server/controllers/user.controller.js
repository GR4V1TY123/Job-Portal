import { User } from "../models/userModel.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";


export const register = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, role } = req.body;
        if (!fullName || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                msg: "A field is missing!",
                success: false
            });
        }
        const file = req?.file
        const fileUri = getDataUri(file)
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content)

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                msg: "User already Exists",
                success: false
            });
        }

        const hashPassword = await bcrypt.hash(password, 10)
        await User.create({
            fullName,
            email,
            phoneNumber,
            password: hashPassword,
            role,
            profile:{
                profilePic: cloudResponse?.secure_url,
            }
        })

        return res.status(201).json({
            msg: "Account created successfully",
            success: true
        })
    }
    catch (e) {
        console.log(e);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body
        if (!email || !password || !role) {
            return res.status(400).json({
                msg: "A field is missing!",
                success: false
            });
        }
        let user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                msg: "Incorrect email or password",
                success: false
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) {
            return res.status(400).json({
                msg: "Incorrect email or password",
                success: false
            })
        }
        if (role !== user.role) {
            return res.status(400).json({
                msg: "Incorrect Role",
                success: false
            })
        }

        user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '15d' })

        return res.status(200).cookie("token", token, { maxAge: 15 * 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            msg: `Welcome Back ${user.fullName}`,
            user,
            success: true
        })
    }
    catch (e) {
        console.log(e)
    }
}

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: "" }).json({
            msg: "Logout successfully",
            success: true
        })
    }
    catch (e) {
        console.log(e)
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, bio, skills } = req.body
        const file = req.file
        const fileUri = getDataUri(file)
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content)

        let skillsArray;
        if (skills) skillsArray = skills.split(",");
        const userId = req.id
        let user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({
                msg: "User not found",
                success: false
            });
        }

        if (fullName) user.fullName = fullName
        if (email) user.email = email
        if (phoneNumber) user.phoneNumber = phoneNumber
        if (bio) user.profile.bio = bio
        if (skills) user.profile.skills = skillsArray
        if(cloudResponse){
            user.profile.resume = cloudResponse.secure_url
            user.profile.resumeName = file.originalname
        }

        await user.save()

        user = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            msg: "Profile updated successfully",
            user,
            success: true
        })
    }
    catch (e) {
        console.log(e)
    }
}