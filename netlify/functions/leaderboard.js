const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "leaderboard.json");

// Load existing leaderboard or create a default one
function loadLeaderboard() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Save leaderboard data
function saveLeaderboard(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

exports.handler = async (event) => {
    if (event.httpMethod === "GET") {
        // Return the leaderboard
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loadLeaderboard()),
        };
    }

    if (event.httpMethod === "POST") {
        try {
            const body = JSON.parse(event.body);
            const { score, name, country } = body;

            if (!score || !name) {
                return { statusCode: 400, body: "Missing score or name." };
            }

            // Load existing leaderboard
            let leaderboard = loadLeaderboard();

            // Add new entry
            leaderboard.push({ name, score, country });

            // Sort and keep top 3 only
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 3);

            // Save updated leaderboard
            saveLeaderboard(leaderboard);

            return { statusCode: 200, body: JSON.stringify(leaderboard) };
        }  catch (error) {
            return {
              statusCode: 500,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ error: "Server error", details: error.message }),
            };
          }
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
