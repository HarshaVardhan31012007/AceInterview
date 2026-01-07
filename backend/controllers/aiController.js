const { GoogleGenAI } = require("@google/genai");
const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts");

console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ SET" : "❌ NOT SET");

// Validate API key exists
if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env file");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

console.log("✓ GoogleGenAI initialized");

// @desc    Generate interview questions and answers using Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

        if( !role || !experience || !topicsToFocus || !numberOfQuestions ){
            return res.status(400).json({ message: "Missing required fields"});
        }

        console.log("\n🤖 Generating questions for:", { role, experience, topicsToFocus, numberOfQuestions });

        const prompt = questionAnswerPrompt( role, experience, topicsToFocus, numberOfQuestions);

        console.log("📝 Prompt created, calling Gemini API with model: gemini-2.5-flash");
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        console.log("✓ Gemini response received");

        let rawText = response.text;
        console.log("📄 Raw text length:", rawText.length);

        // Clean it: Remove ```json and ``` from beginning and end
        const cleanedText = rawText
            .replace(/^```json\s*/, "") // remove starting ```json
            .replace(/```$/, "") // remove ending ```
            .trim(); // remove extra spaces

        console.log("🧹 Cleaned text length:", cleanedText.length);

        // Now safe to parse
        const data = JSON.parse(cleanedText);
        console.log("✓ JSON parsed successfully, questions count:", data.length);

        res.status(200).json(data);       
    } catch (error) {
        console.error("\n❌ AI Question Generation Error:");
        console.error("   Message:", error.message);
        console.error("   Stack:", error.stack);
        res.status(500).json({ message: "Failed to generate questions", error: error.message });
    }
};


// @desc    Generate explains a interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
    try {
        const { question } = req.body;
        if(!question){
            return res.status(400).json({ message: "Missing required fields" });
        }

        const prompt = conceptExplainPrompt(question);

        console.log("📝 Prompt created, calling Gemini API with model: gemini-2.5-flash");
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        console.log("✓ Gemini response received");

        let rawText = response.text;

        // Clean it: Remove ```json and ``` from beginning and end
        const cleanedText = rawText
            .replace(/^```json\s*/, "") //remove starting ```json
            .replace(/```$/, "") // remove ending
            .trim(); // remove extra spaces

        // Now safe to parse
        const data = JSON.parse(cleanedText);

        res.status(200).json(data);
    } catch (error) {
        console.error("AI Explanation Generation Error:", error.message || error);
        res.status(500).json({ message: "Failed to generate explanation", error: error.message, });     
    }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
