const fs = require("fs/promises");


const map = {
  "UC Berkeley undergraduate/graduate/postdoc": "UCB Alumni",
  "Asian or South Asian": "Asian American/Asian",
  "Black or African-American": "African American/Black",
  "Indegenous or Native American": "American Indian/Alaskan Native",
  "Immigrant Founder or Foreign Founder": "",
  "LGBTQ+": "",
  "Female": "Female",
}

const INPUT_FILE_NAMES = [
  `B21 Cohort`,
  `B21 Pad-13`,
  `B21 IPP`,
  `B20 Cohort`,
  `B20 Pad-13`,
  `B20 IPP`,
  `B19 Cohort`,
  `B19 Pad-13`,
  `B19 IPP`,
  `B19 Europe`,
  `B18+B19 BSEM`,
  `B18 Cohort`,
  `B18 Pad-13`,
  `B18 IPP`,
  `B18 BSEM`,
  `B17 Cohort`,
  `B17 Pad-13`,
  `B17 IPP`,
  `B17 BSEM`,
  `B16 Cohort`,
  `B16 Pad-13`,
  `B16 IPP`,
  `B16 BSEM`,
  `B15 Cohort`,
  `B15 Pad-13`,
  `B15 IPP`,
  `B15 BSEM`,
  `B14 Pad-13`,
  `B14 IPP`,
  `B14 Cohort`,
  `B14 BSEM`,
  `B13 SVV`,
  `B13 Pad13IPP`,
  `B13 IPP`,
  `B13 Cohort`,
  `B12 Pad-13`,
  `B12 Hotdesk`,
  `B12 GIP_UIP`,
  `B12 Cohort`,
  `B11 Hotdesk`,
  `B11 GIP_UIP`,
  `B11 Cohort`  
];
  
function stripMarkdownCodeFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:csv)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

let response = `Name\tTitle\tEmail\tPhone Number\tLinkedIn\tDEI\tCompany\tBatch\n`;

async function parseSpreadsheetWithGemini(inputFileSource) {
  const csvText = await fs.readFile("./data/" + inputFileSource + ".tsv", "utf8");
  const outputFile = `./out/result-parsed.tsv`;
 
  const rows = csvText.split('\n');
  const headers = rows[0].split("\t");
  const dataPoints = ["- Name", "- Title", "- Email", "Number", "- LinkedIn", "Optional:,DEI"];
  
  rows.forEach((row, j) => {
    if (j > 0) {
      const vals = row.split("\t");
      let counted = 0;


      let k = -1;
      for (let i = 1; i <= 3; i++) {
        let curString = ''
        dataPoints.forEach((point, k) => {
          const idx = headers.findIndex(head => (head.includes(`${i}`) && point.split(",").some(p => head.toLowerCase().includes(p.toLowerCase()))));
         
          if (idx >= 0 && (curString.trim() || k == 0)) {
            let add = vals[idx];
            if ((point === "Optional:" || headers[idx] && headers[idx].includes("DEI"))  && vals[idx]) {
              add = vals[idx].split(',').map((dei) => map[Object.keys(map).find(key => dei.includes(key))] ).filter(s => s && s.length > 0).join(',')
            }
            if (add) {
 
              curString += add;
            }
          }
          curString += "\t";
          
        })
        if (curString.trim()) {
          curString +=  vals[headers.findIndex(head => head.toLowerCase().includes("company name") || head.toLowerCase().includes("startup"))] + "\t" + inputFileSource;
          response += curString.trim() + "\n";
        }
      }
    }

  })

  await fs.writeFile(outputFile, `${stripMarkdownCodeFence(response)}\n`, "utf8");
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
