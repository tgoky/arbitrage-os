const fs = require('fs');
const path = require('path');

// Function to properly escape content for JavaScript
function escapeForJS(str) {
  return JSON.stringify(str);
}

// Function to extract markdown content
function extractMarkdownContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim();
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// Function to update the prompt templates array
function updatePromptTemplates() {
  const markdownDir = './src/app/prompt-directory/jsons';
  const outputFile = './safe-prompt-templates.js';
  
  // Read all markdown files
  const files = fs.readdirSync(markdownDir).filter(file => file.endsWith('.md'));
  
  const updatedPrompts = [];
  
  files.forEach(file => {
    const fileNumber = parseInt(file.split('-')[0]);
    
    // Skip files that don't start with a number
    if (isNaN(fileNumber)) {
      console.log(`Skipping: ${file} (no valid ID found)`);
      return;
    }
    
    const filePath = path.join(markdownDir, file);
    const content = extractMarkdownContent(filePath);
    
    console.log(`Processing: ${file} (ID: ${fileNumber})`);
    console.log(`Extracted content length: ${content.length} characters`);
    
    updatedPrompts.push({
      id: fileNumber,
      content: content
    });
  });
  
  // Sort by ID
  updatedPrompts.sort((a, b) => a.id - b.id);
  
  // Generate the output using JSON.stringify for safe escaping
  const output = `// Safe markdown content extraction
// Copy these values into your promptTemplates array

const markdownContentById = {
${updatedPrompts.map(prompt => `  ${prompt.id}: ${escapeForJS(prompt.content)}`).join(',\n')}
};

// Usage example:
// shortDescription: markdownContentById[1]

export { markdownContentById };
`;

  fs.writeFileSync(outputFile, output);
  console.log(`\nSafe prompt data written to: ${outputFile}`);
  console.log(`Processed ${updatedPrompts.length} files successfully`);
}

// Run the script
updatePromptTemplates();