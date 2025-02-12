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
            const { score, name, country } = body;

            if (!score || !name) {
                return { statusCode: 400, body: "Missing score or name." };
            }

            // Check if the player already exists
            let existingPlayerIndex = leaderboard.findIndex(entry => entry.name === name);

            if (existingPlayerIndex !== -1) {
                // Update score if the new one is higher
                if (score > leaderboard[existingPlayerIndex].score) {
                    leaderboard[existingPlayerIndex].score = score;
                }
            } else {
                // Add new entry
                leaderboard.push({ name, score, country });
            }

            // Sort and keep top 3 only
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 3);

            // Convert leaderboard to a string and store it
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
