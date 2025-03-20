chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetch_hackathons") {
        console.log("Fetching hackathons from server");

        (async () => {
            try {
                const response = await fetch("http://localhost:3000/hackathons", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();
                console.log({
                    totalFetched: data.length,
                    mlhCount: data.filter(h => h.source === 'MLH').length,
                    devpostCount: data.filter(h => h.source === 'Devpost').length
                });
                
                sendResponse({ success: true, data: data });
            } catch (error) {
                console.error("Error:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true;
    }
});