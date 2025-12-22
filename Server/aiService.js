// server/aiService.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // "flash" is faster and free-er

// --- FUNCTION 1: Single Player Opponent ---
async function generateRebuttal(topic, userArgument) {
  try {
    const prompt = `
      You are a skilled debater in a game. 
      Topic: "${topic}". 
      User Argument: "${userArgument}".
      
      Your goal: Respectfully but logically rebut the user's argument in under 100 words.
      Do not be overly polite, be competitive but safe.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Gemini Error (Rebuttal):", error);
    return "I am struggling to think of a response. (API Error)";
  }
}

// --- FUNCTION 2: Multiplayer Judge ---
async function judgeDebate(topic, transcript) {
  try {
    // Format the transcript for the AI to read
    const transcriptText = JSON.stringify(transcript);
    
    const prompt = `
      You are an impartial debate judge.
      Topic: "${topic}"
      Transcript: ${transcriptText}
      
      Task: Analyze the debate and declare a winner based on logic and evidence.
      Output ONLY a JSON string (no markdown, no backticks) in this format:
      { "winner": "Player 1", "score_p1": 8, "score_p2": 7, "reasoning": "Explain why in 1 sentence." }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Clean up the text just in case Gemini adds ```json
    let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error (Judging):", error);
    return { winner: "Error", reasoning: "Could not judge debate." };
  }
}

module.exports = { generateRebuttal, judgeDebate };