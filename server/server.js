const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Hackathon = require("./model/scraper.model");
const path = require("path");
const { fetchMLHHackathons, fetchDevpostHackathons } = require("./scraper");
const Subscriber = require("./model/user.model");
const { sendNewHackathonNotification } = require("./mailer");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


connectDB();

// Scrape and Store Hackathons in MongoDB (Prevents Duplicates)
async function scrapeAndStoreHackathons() {
    try {
        const [existingHackathons, mlhNew, devpostNew] = await Promise.all([
            Hackathon.find(),
            fetchMLHHackathons(),
            fetchDevpostHackathons()
        ]);

        const combinedNew = [...mlhNew, ...devpostNew];
        const newHackathons = combinedNew.filter(newHack => 
            !existingHackathons.some(existing => 
                existing.name === newHack.name && 
                existing.source === newHack.source
            )
        );

        await Hackathon.deleteMany({});
        await Hackathon.insertMany(combinedNew);

        if (newHackathons.length > 0) {
            const subscribers = await Subscriber.find();
            subscribers.forEach(async (subscriber) => {
                await sendNewHackathonNotification(subscriber.email, newHackathons);
                await Subscriber.updateOne(
                    { _id: subscriber._id },
                    { lastNotified: new Date() }
                );
            });
        }

        console.log(`Stored ${combinedNew.length} hackathons, ${newHackathons.length} new`);
    } catch (error) {
        console.error('Storage error:', error);
    }
}

// API Route to Get Stored Hackathons
app.get('/hackathons', async (req, res) => {
    try {
        const hackathons = await Hackathon.find().lean();
        console.log({
            sending: hackathons.length,
            mlh: hackathons.filter(h => h.source === 'MLH').length,
            devpost: hackathons.filter(h => h.source === 'Devpost').length
        });
        res.json(hackathons);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/subscribe", async (req, res) => {
    try {
        const subscriber = await Subscriber.create({ email: req.body.email });
        res.status(201).json({ success: true, data: subscriber });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post("/unsubscribe", async (req, res) => {
    try {
        await Subscriber.deleteOne({ email: req.body.email });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Scrape every 1 hour
setInterval(scrapeAndStoreHackathons, 60 * 60 * 1000);

// Initial scrape on startup
scrapeAndStoreHackathons();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
