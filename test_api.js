// const fetch = require('node-fetch'); // Built-in in Node 18+

async function testCreateLead() {
    const data = {
        firstName: "Test",
        lastName: "API",
        phone: "1234567890",
        email: "test@api.com",
        budgetMin: 1000000,
        budgetMax: 2000000,
        source: "API Test",
        status: "New",
        tags: ["Test"],
        score: 10
    };

    try {
        const response = await fetch('http://localhost:3000/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const json = await response.json();
            console.log("Success:", json);
        } else {
            console.error("Error:", response.status, response.statusText);
            const text = await response.text();
            console.error("Body:", text);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testCreateLead();
