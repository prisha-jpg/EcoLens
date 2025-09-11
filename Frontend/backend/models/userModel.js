import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required:true},
    email: {type: String, required:true, unique:true},
    password: {type: String, required:true},
    cartData: {type: Object, default: {}},
    // Profile fields
    bio: { type: String, default: '' },
    avatarSeed: { type: String, default: '' },
    avatarColors: { type: [String], default: [] },
    // Stats placeholders (persist basic counters; can be refined later)
    stats: {
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        xpToNext: { type: Number, default: 100 },
        totalScans: { type: Number, default: 0 },
        ecoScore: { type: String, default: 'C' },
        sustainableChoices: { type: Number, default: 0 },
        carbonSaved: { type: Number, default: 0 },
        waterSaved: { type: Number, default: 0 },
        treesPlanted: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        rank: { type: String, default: 'Eco Beginner' },
        badges: { type: Number, default: 0 },
        challengesCompleted: { type: Number, default: 0 }
    },

}, {minimize:false})

const userModel = mongoose.model.user || mongoose.model('user', userSchema);

export default userModel;