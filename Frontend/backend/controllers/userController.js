
import userModel from '../models/userModel.js';
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const createToken = (id, role = "user") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '5h' });
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, msg: "User doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id, "user");

            // Exclude password
            const userData = {
                _id: user._id,
                name: user.name,
                email: user.email
            };

            res.json({ success: true, token, user: userData });
        } else {
            res.json({ success: false, msg: "Invalid credentials" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, msg: error.message });
    }
};

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, msg: "User already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, msg: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, msg: "Password should be at least 8 characters long" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({ name, email, password: hashedPassword });
        const user = await newUser.save();

        const token = createToken(user._id, "user");

        // Exclude password
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        res.json({ success: true, token, user: userData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, msg: error.message });
    }
};

export { loginUser, registerUser};
 
// Get current user profile
const getMe = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, msg: 'Invalid user id' });
        }
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }
        return res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, msg: error.message });
    }
};

// Update current user profile
const updateMe = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, msg: 'Invalid user id' });
        }

        const allowed = ['name', 'email', 'bio', 'avatarSeed', 'avatarColors', 'stats'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        // prevent email duplicates if email is being updated
        if (updates.email) {
            const exists = await userModel.findOne({ email: updates.email, _id: { $ne: userId } });
            if (exists) {
                return res.status(400).json({ success: false, msg: 'Email already in use' });
            }
            if (!validator.isEmail(updates.email)) {
                return res.status(400).json({ success: false, msg: 'Please enter a valid email' });
            }
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        return res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, msg: error.message });
    }
};

export { getMe, updateMe };
