const { OpenAI } = require("openai");
const path = require("path");
const fs = require("fs");
const Papa = require("papaparse");
const extractRegulatoryInstructionsPromt = require("../prompts/extractRegulatoryInstructionsPromt");

// OpenAI setup
const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// OpenAI function to extract regulatory instructions
const extractRegulatoryInstructions = async (
  fileText,
  csvDataSetPath,
  fileName
) => {
  let csvHeaders = null;
  let csvFirstRowData = null;
  if (csvDataSetPath) {
    const csvData = fs.readFileSync(csvDataSetPath, "utf8");
    const parsedData = Papa.parse(csvData, { header: true });
    if (parsedData.data.length > 0) {
      csvHeaders = Object.keys(parsedData.data[0]).join(",");
      csvFirstRowData = Object.values(parsedData.data[0]).join(",");
    }
  }

  const prompt = extractRegulatoryInstructionsPromt(
    fileText,
    csvHeaders,
    csvFirstRowData
  );

  try {
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const responseContent = completion.choices[0].message.content
      .trim()
      .replace(/`/g, "");
    const match = responseContent.match(/\[.*\]/s);

    // Create the fileText directory if it doesn't exist
    const fileTextDir = path.join(
      process.cwd(),
      "uploads",
      "instructions-response"
    );
    if (!fs.existsSync(fileTextDir)) {
      fs.mkdirSync(fileTextDir);
    }

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      fileTextDir,
      `${fileName}-${timestamp}.txt`
    );

    // Save OpenAI response to a file (ensure it's a string)
    fs.writeFileSync(outputFilePath, match[0], "utf-8");
    try {
      if (match && match[0]) {
        return JSON.parse(match[0]) || [];
      }
    } catch (error) {
      console.error("No valid JSON found in the response.", error);
      return [];
    }
  } catch (err) {
    console.error("Error processing text with GPT-4o-mini:", err);
    return [];
  }
};

const updateInstructionRules = async (rules, command) => {
  const prompt = `
    Make sure to keep json intact. Update the json regulatory rules as per below instructions.
    ${command}
    Ensure to return the output in same structured way as array of JSON array objects
        #field_name: The name of the field being validated (e.g., "Transaction Amount", "Account Balance").

        #rule_name: A short name for the validation rule (e.g., "Amount Match", "Non-Negative Balance").

        #description: A detailed explanation of the rule based on the instruction.

        #data_type: The expected data type for the field (e.g., "float", "string", "date").

        #validation_logic: The logic or expression used for validation (e.g., "amount == reported_amount", "amount >= 0").

        #error_message: A message that will be displayed if the validation fails (e.g., "Transaction amount must match the reported amount").

        #allowable_values: Any predefined allowable values (e.g., ranges, specific country codes, or other predefined values).
    Keep all other rules intact, just make the changes, where ever asked to make.
  `;

  try {
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const responseContent = completion.choices[0].message.content
      .trim()
      .replace(/`/g, "");
    const match = responseContent.match(/\[.*\]/s);

    try {
      if (match && match[0]) {
        return JSON.parse(match[0]) || [];
      }
    } catch (err) {
      console.error("No valid JSON found in the response.", err);
      return [];
    }
  } catch (err) {
    console.error("Error processing text with GPT-4o-mini:", err);
    return [];
  }
};

module.exports = { extractRegulatoryInstructions, updateInstructionRules };
