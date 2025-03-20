const mongoose = require("mongoose");

const HackathonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    submission_date: { type: String, required: true },
    location: {
        city: { type: String, default: "Unknown" },
        state: { type: String, default: "Unknown" }
    },
    image: { type: String, required: true },
    source: { 
        type: String, 
        required: true,
        enum: ['MLH', 'Devpost']
    },
    url: String
});

module.exports = mongoose.model("Hackathon", HackathonSchema);
