/**
 * Usage:
 *   1. Set the OpenAI API key.
 *   2. Set this code in Google Apps Script.
 *   3. Configure the columns in the spreadsheet.
 * 
 * Notes:
 * - As this is a prototype, the following issues exist:
 *   - The assigned category might change even for the same project.
 *   - The AI might not be able to assign categories to all projects.
 *   - The number of categories might diverge.
 * - These issues will be improved using the following methods:
 *   - Prompt tuning
 *   - Agentization of AI (integration of AI and the system)
 */


// OpenAI .env
const API_URL = 'https://api.openai.com/v1/chat/completions'  // URL
const API_KEY = 'sk-******'  // API key

// Google Spreadsheet .env
const SHEET_INDEX = 0  // index of form sheet
const PROJECT_COLUMN = 10  // column number of challenge & needs
const CATEGORY_COLUMN = 13  // column number of category

// Prompt
const PROMPT = `Based on the provided projects information, return the categories to which the projects belongs in JSON format.
**Please ensure that you strictly adhere to the following constraints when creating the output**.

## Constraints

- The category should be created as a single English word.
- **Group the projects into the same category as much as possible**.
- Match the number of output categories with the number of provided project information.

example:

{
  rows: [category1, category2, ...]
}
`

function onEdit(e) {
  // Get values from the spreadsheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[SHEET_INDEX]  // form sheet
  const columns = sheet.getRange(2, PROJECT_COLUMN, sheet.getLastRow() - 1, 2)  // challenge & needs
  const values = columns.getValues()

  console.log({ values })

  // Format into JSON strtings
  const projects = values.map((row) => `project: { challenge: ${row[0]}, needs: ${row[1]} }`)  // project dict
  const message = `projects: [${projects.join(',')}]`  // projects array

  console.log({ message })

  try {
    // Request to OpenAI API
    const response = UrlFetchApp.fetch(API_URL, {
      'method': 'post',
      'contentType': 'application/json',
      'headers': { 'Authorization': 'Bearer ' + API_KEY },
      'payload': JSON.stringify({
        'model': 'gpt-4o-mini',
        'response_format': { 'type': 'json_object' },
        'messages': [
          { 'role': 'system', 'content': PROMPT },
          { 'role': 'user', 'content': message }
        ]
      })
    })

    console.log({ response })
    
    // Parse OpenAI response
    const data = JSON.parse(response.getContentText())  // payload
    const content = data.choices[0].message.content

    console.log({ content })

    // Parse JSON content in the response
    const rows1d = JSON.parse(content).rows  // 1-D array
    const rows2d = rows1d.map((row) => [row])  // 2-D array to write categories into sheet

    console.log({ rows2d })

    // Write categories into the sheet
    sheet.getRange(2, CATEGORY_COLUMN, rows2d.length, 1).setValues(rows2d)
  } catch (error) {
    Logger.log({ error });
  }
}
