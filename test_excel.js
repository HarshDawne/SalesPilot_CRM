const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("Starting Excel Import/Export Test...");

    // 1. Test Template Download
    console.log("\n1. Testing Template Download...");
    try {
        const res = await fetch(`${BASE_URL}/leads/template`);
        const text = await res.text();
        console.log("Template Download:", res.status === 200 && text.includes("firstName,lastName") ? "Success" : "Failed");
    } catch (e) {
        console.error("Template Error:", e);
    }

    // 2. Test Import
    console.log("\n2. Testing Import...");
    const csvContent = "firstName,lastName,phone,email,source\nImport,User,9998887775,import@test.com,ImportTest";
    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv');

    try {
        const res = await fetch(`${BASE_URL}/leads/import`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        console.log("Import Response:", res.status, data.status === "success" ? "Success" : "Failed");
        console.log("Created:", data.created);
    } catch (e) {
        console.error("Import Error:", e);
    }

    // 3. Test Export
    console.log("\n3. Testing Export...");
    try {
        const res = await fetch(`${BASE_URL}/leads/export`);
        const text = await res.text();
        console.log("Export Download:", res.status === 200 && text.includes("Import,User") ? "Success" : "Failed");
    } catch (e) {
        console.error("Export Error:", e);
    }
}

runTest();
