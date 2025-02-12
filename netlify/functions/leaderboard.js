let leaderboard = JSON.parse(process.env.LEADERBOARD || "[]");

exports.handler = async (event) => {
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

            // Add new entry
            leaderboard.push({ name, score, country });

            // Sort and keep top 3 only
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 3);

            // Convert leaderboard to a string and store it in the environment
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

    return { statusCode: 405, body: "Method Not Allowed" };
};
