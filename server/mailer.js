const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendNewHackathonNotification(email, hackathons) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `New Hackathons Available! (${hackathons.length} New Events)`,
        html: `
            <h2>New Hackathons Found!</h2>
            ${hackathons.map(h => `
                <div style="margin-bottom: 20px;">
                    <h3>${h.name}</h3>
                    <p>Location: ${h.location.city}, ${h.location.state}</p>
                    <p>Dates: ${h.submission_date}</p>
                    <a href="${h.url}">View Details</a>
                </div>
            `).join("")}
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendNewHackathonNotification };