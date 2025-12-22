// server/debug.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const envPath = path.join(__dirname, '.env');

console.log("--- DEBUG REPORT ---");
console.log("1. Looking for .env file at:", envPath);

if (fs.existsSync(envPath)) {
    console.log("2. SUCCESS: File found!");
    const content = fs.readFileSync(envPath, 'utf8');
    console.log("3. File content preview (first 10 chars):", content.substring(0, 10) + "...");
} else {
    console.log("2. FAILURE: File NOT found. Check file name!");
    // Check if maybe it's named .env.txt
    if (fs.existsSync(envPath + '.txt')) {
        console.log("   -> FOUND '.env.txt' instead! Please rename it to just '.env'");
    }
}

console.log("4. Loaded Key:", process.env.OPENAI_API_KEY ? "YES (Key starts with " + process.env.OPENAI_API_KEY.substring(0, 3) + ")" : "NO (Undefined)");
console.log("--------------------");