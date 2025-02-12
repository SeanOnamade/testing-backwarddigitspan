exports.handler = async (event) => {
    let leaderboard = JSON.parse(process.env.LEADERBOARD || "[]");

    if (event.httpMethod === "GET") {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leaderboard),
        };
    }

    if (event.httpMethod === "POST") {
        try {
            const body = JSON.parse(event.body);
            const { playerId, score, name, country } = body;

            if (!playerId || !score || !name) {
                return { statusCode: 400, body: "Missing playerId, score, or name." };
            }

            // Check if the player already exists in the leaderboard
            let existingPlayerIndex = leaderboard.findIndex(entry => entry.playerId === playerId);

            if (existingPlayerIndex !== -1) {
                // Prevent duplicate entries by updating the existing score
                if (score > leaderboard[existingPlayerIndex].score) {
                    leaderboard[existingPlayerIndex].score = score;
                    leaderboard[existingPlayerIndex].name = name; // Update name if necessary
                }
            } else {
                // Add new entry
                leaderboard.push({ playerId, name, score, country });
            }

            // Sort and keep top 3 only
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 3);

            // Store the leaderboard
            process.env.LEADERBOARD = JSON.stringify(leaderboard);

            return { statusCode: 200, body: JSON.stringify(leaderboard) };
        } catch (error) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Server error", details: error.message }),
            };
        }
    }

    if (event.httpMethod === "DELETE") {
        process.env.LEADERBOARD = JSON.stringify([]);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Leaderboard reset successfully." }),
        };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
