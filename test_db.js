const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function readDb() {
    console.log("Reading from:", DB_PATH);
    if (!fs.existsSync(DB_PATH)) {
        console.log("File not found");
        return;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const json = JSON.parse(data);
    console.log("Read success. Users:", json.users.length, "Leads:", json.leads.length);
    return json;
}

try {
    readDb();
} catch (e) {
    console.error("Error:", e);
}
