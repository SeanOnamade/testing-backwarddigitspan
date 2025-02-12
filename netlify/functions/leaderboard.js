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
            const { score, name, country, playerId } = body;

            if (!score || !name || !playerId) {
                return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields." }) };
            }

            // Validate JSON before storing
            if (typeof score !== "number" || typeof name !== "string" || typeof playerId !== "string") {
                return { statusCode: 400, body: JSON.stringify({ error: "Invalid data format." }) };
            }

            // Check if the player already exists
            let existingPlayerIndex = leaderboard.findIndex(entry => entry.playerId === playerId);

            if (existingPlayerIndex !== -1) {
                // Update score only if higher
                if (score > leaderboard[existingPlayerIndex].score) {
                    leaderboard[existingPlayerIndex].score = score;
                } else {
                    return { statusCode: 400, body: JSON.stringify({ error: "Duplicate entry: Score not higher than previous." }) };
                }
            } else {
                // Add new entry
                leaderboard.push({ playerId, name, score, country });
            }

            // Sort and keep top 3 only
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 3);

            // Store leaderboard
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

    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
};
