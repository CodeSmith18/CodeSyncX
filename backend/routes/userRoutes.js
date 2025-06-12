import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';
import Code from "../Models/codeModel.js";

const router = express.Router();


// ⏫ Upload code
router.post('/uploadCode', async (req, res) => {
    const { code, input, output, userId, selectedLanguage } = req.body;

    const title = "something";

    console.log(code);


    try {
        const newCode = new Code({ title, code, input, output, userId, selectedLanguage });
        await newCode.save();
        res.status(201).json(newCode);

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error);
    }
});


// 📄 Get code references for a user (only id, title, createdAt)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const codeRefs = await Code.find({ userId }) // fixed typo: userID -> userId
            .select('_id title createdAt selectedLanguage')
            .sort({ createdAt: -1 });

        res.status(200).json(codeRefs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete("/deletecode/:id", async (req, res) => {
    try {
        const codeId = req.params.id;
        await Code.findByIdAndDelete(codeId);
        res.status(200).json({ message: "Code deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete code" });
    }
})


// 🧾 Get a full code by code ID
router.get('/getcode/:codeId', async (req, res) => {
    const { codeId } = req.params;

    try {
        const code = await Code.findById(codeId);
        if (!code) return res.status(404).json({ error: 'Code not found' });

        res.status(200).json(code);
        console.log(code);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 🔐 Sign Up (Email/password)
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    console.log(username);

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();

        return res.status(201).json({ success: true, message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


// 🔓 Login (Email/password)
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing email or password" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log(user);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });



        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            username: user.username,
            userId: user._id
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


export default router;
