document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup initialized");

    document.getElementById("fetchHackathons").addEventListener("click", fetchHackathons);
    document.getElementById("filterHackathons").addEventListener("click", filterHackathons);

    function fetchHackathons() {
        const locationInput = document.querySelector("#locationInput");
        locationInput.value = "";

        console.log("Fetch button clicked, requesting hackathons...");

        const hackathonList = document.getElementById("hackathonList");
        hackathonList.innerHTML = "<p>Loading...</p>";

        try {
            
            chrome.runtime.sendMessage({ action: "fetch_hackathons" }, response => {
                if (chrome.runtime.lastError) {
                    throw new Error(chrome.runtime.lastError.message);
                }

                if (!response || !response.success) {
                    throw new Error("Failed to fetch hackathons");
                }

                const data = response.data;
                console.log("Total hackathons received:", data.length);
                console.log("MLH count:", data.filter(h => h.source === "MLH").length);
                console.log("Devpost count:", data.filter(h => h.source === "Devpost").length);

                if (!data || data.length === 0) {
                    hackathonList.innerHTML = "<p>No hackathons found.</p>";
                    return;
                }

                
                chrome.storage.local.set({ hackathons: data }, () => {
                    console.log("Hackathons saved to chrome.storage.local");
                    updateHackathonCount(data);
                    displayHackathons(data);
                });
            });
        } catch (error) {
            console.error(" Error fetching hackathons:", error);
            hackathonList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    }

    function filterHackathons() {
        const locationInput = document.getElementById("locationInput").value.trim().toLowerCase();
        console.log(`🔍 Searching for location: "${locationInput}"`);

        chrome.storage.local.get("hackathons", (result) => {
            if (!result.hackathons || result.hackathons.length === 0) {
                document.getElementById("hackathonList").innerText = "No hackathons stored.";
                return;
            }

            let filteredHackathons = result.hackathons.filter(hackathon => {
                const city = (hackathon.location?.city || "").toLowerCase();
                const state = (hackathon.location?.state || "").toLowerCase();
                return city.includes(locationInput) || state.includes(locationInput);
            });

            console.log(`Found ${filteredHackathons.length} results for "${locationInput}"`);

            if (filteredHackathons.length === 0) {
                document.getElementById("hackathonList").innerText = "No matching hackathons found.";
                return;
            }

            displayHackathons(filteredHackathons);
        });
    }

    function displayHackathons(hackathons) {
        const hackathonList = document.getElementById("hackathonList");
        hackathonList.innerHTML = "";

        hackathons.forEach((hackathon, index) => {
            const item = document.createElement("div");
            item.classList.add("hackathon-item", "fade-in");
            item.style.animationDelay = `${0.4 + (index * 0.1)}s`;

            item.innerHTML = `
                <div class="hackathon-header">
                    <div>
                        <h3 class="hackathon-title">${hackathon.name}</h3>
                        <p class="hackathon-location">${hackathon.location.city}, ${hackathon.location.state}</p>
                    </div>
                    <span class="status-badge">${isSubmissionOpen(hackathon.submission_date) ? 'Active' : 'Ended'}</span>
                </div>
                <div class="hackathon-content">
                    <div class="hackathon-text">
                        <div class="hackathon-info">
                            <div class="info-item">
                                <svg class="h-4 w-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>${hackathon.submission_date}</span>
                            </div>
                        </div>
                    </div>
                    <img src="${hackathon.image || 'hackathon-image.jpg'}" alt="${hackathon.name}" class="hackathon-image">
                </div>
                <button class="view-details" data-url="${hackathon.url}">View Details →</button>
            `;

        
            item.querySelector('.view-details').addEventListener('click', function () {
                const url = this.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            });

            hackathonList.appendChild(item);
        });

        console.log("Hackathons successfully displayed.");
    }

    function isSubmissionOpen(submissionDate) {
        if (!submissionDate) return false;

        const dateString = submissionDate.split(' - ').pop();

        const cleanedDate = dateString.replace(/(st|nd|rd|th)/, '');

        let finalDate = cleanedDate.match(/\d{4}/) ? cleanedDate : `${cleanedDate}, 2025`;

        const endDate = new Date(finalDate);

        return endDate ? endDate >= new Date() : false;
    }

    function updateHackathonCount(hackathons) {
        const statValues = document.querySelectorAll("#stats .stat-value");
    
        if (!statValues || statValues.length < 2) {
            console.error("Count elements not found in popup.html");
            return;
        }
    
        const total = hackathons.length;
        const active = hackathons.filter(h => isSubmissionOpen(h.submission_date)).length;
    
        statValues[0].textContent = total;  
        statValues[1].textContent = active; 
    
        console.log(`Total Hackathons: ${total}, Active: ${active}`);
    }

    document.getElementById("subscribeButton").addEventListener("click", handleSubscription);

async function handleSubscription() {
    const email = document.getElementById("emailInput").value.trim();
    const statusEl = document.querySelector(".subscription-status");

    if (!validateEmail(email)) {
        statusEl.textContent = "Please enter a valid email address";
        statusEl.style.color = "var(--dracula-red)";
        return;
    }

    try {
        const response = await fetch("YOUR_DEPLOYED_SERVER_URL/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (data.success) {
            statusEl.textContent = "Subscribed successfully!";
            statusEl.style.color = "var(--dracula-green)";
        } else {
            statusEl.textContent = data.error || "Subscription failed";
            statusEl.style.color = "var(--dracula-red)";
        }
    } catch (error) {
        statusEl.textContent = "Error connecting to server";
        statusEl.style.color = "var(--dracula-red)";
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
    
});
