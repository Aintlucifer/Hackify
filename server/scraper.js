const axios = require("axios");
const puppeteer = require("puppeteer");

async function fetchMLHHackathons() {
    console.log("Fetching MLH hackathons...");
    let events = [];

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        const page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        await page.goto("https://mlh.io/seasons/2025/events", { waitUntil: "domcontentloaded" });

        events = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".event")).map(event => ({
                name: event.querySelector(".event-name")?.textContent.trim() || "N/A",
                submission_date: event.querySelector(".event-date")?.textContent.trim() || "Unknown",
                location: {
                    city: event.querySelector('[itemprop="city"]')?.textContent.trim() || "Unknown",
                    state: event.querySelector('[itemprop="state"]')?.textContent.trim() || "Unknown"
                },
                image: event.querySelector(".image-wrap img")?.src || "",
                url: event.closest("a")?.href || "https://mlh.io/seasons/2025/events",
                source: "MLH"
            }));
        });

        await browser.close();
        console.log(`Fetched ${events.length} MLH hackathons.`);
    } catch (error) {
        console.error("Error fetching MLH hackathons:", error);
    }

    return events;
}

async function fetchDevpostHackathons() {
    console.log("Fetching Devpost hackathons...");
    let page = 1, allHackathons = [];

    try {
        while (allHackathons.length < 50 && page <= 3) {
            const apiUrl = `https://devpost.com/api/hackathons?page=${page}&per_page=20&status[]=upcoming&status[]=open`;
            const response = await axios.get(apiUrl, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": "https://devpost.com/hackathons"
                }
            });

            if (!response.data.hackathons || response.data.hackathons.length === 0) break;

            const hackathons = response.data.hackathons.map(hackathon => ({
                name: hackathon.title,
                location: {
                    city: hackathon.displayed_location?.city || "Online",
                    state: hackathon.displayed_location?.state || "N/A"
                },
                submission_date: hackathon.submission_period_dates,
                image: hackathon.thumbnail_url ? `https:${hackathon.thumbnail_url}` : null,
                url: hackathon.url || null,
                source: "Devpost"
            }));

            allHackathons = allHackathons.concat(hackathons);
            console.log(`Page ${page}: Fetched ${hackathons.length} Devpost hackathons`);

            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
            page++;
        }
    } catch (error) {
        console.error("Error fetching Devpost hackathons:", error);
    }

    console.log(`Total Devpost Hackathons Fetched: ${allHackathons.length}`);
    return allHackathons;
}

module.exports = { fetchMLHHackathons, fetchDevpostHackathons };