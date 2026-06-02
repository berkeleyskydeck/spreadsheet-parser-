const fs = require("fs/promises");
require('dotenv').config()

const GEMINI_API_KEY = process.env.API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

const INPUT_FILE_NAMES = 
  [
    "16",
    "16-bsem",
    "16-pad13",

  ];
const PARSE_PROMPT =
  'You are a data formatter. Parse the DEI checkbox column for each person (columns mentioning "will be added to relevant communities") to extract ethnicity and gender, then return the full CSV with: Person X - Gender columns inserted after each person\'s (1, 2, 3) DEI column. Ethnicity options: African American/Black, American Indian/Alaskan Native, Asian American/Asian, Latinx, Middle Eastern, Pacific Islander, White/Cacasian. Gender options: Female, Male. Leave blank if no match. Return CSV only as text, no commentary.';

function stripMarkdownCodeFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:csv)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

async function parseSpreadsheetWithGemini(inputFileSource) {
  const csvText = await fs.readFile(inputFileSource + ".csv", "utf8");
  const outputFile = `${inputFileSource}-parsed.csv`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${DEI_PARSE_PROMPT}\n\nCSV input:\n${csvText}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API request failed with ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();
  const parsedCsv = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");

  if (!parsedCsv) {
    throw new Error("Gemini API response did not include CSV text.");
  }

  await fs.writeFile(outputFile, `${stripMarkdownCodeFence(parsedCsv)}\n`, "utf8");
  return outputFile;
}


if (require.main === module) {
  INPUT_FILE_NAMES.forEach(fileName => {
    console.log(`Processing ${fileName}.csv`)
    parseSpreadsheetWithGemini(fileName)
    .then((outputFile) => {
      console.log(`Parsed CSV written to ${outputFile}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  } )

}

module.exports = {
  parseSpreadsheetWithGemini,
};
