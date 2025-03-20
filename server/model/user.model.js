const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastNotified: Date
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);