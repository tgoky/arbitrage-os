const fs = require('fs');
const path = require('path');

// Function to extract and format the full markdown content
function extractMarkdownContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Return the full content, properly formatted
    return content.trim();
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// Function to escape content for template literals
function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');
}

// Function to update the prompt templates array
function updatePromptTemplates() {
  const markdownDir = './src/app/prompt-directory/jsons';
  const outputFile = './updated-prompt-templates.js';
  
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
    console.log('---');
    
    updatedPrompts.push({
      id: fileNumber,
      shortDescription: escapeForTemplateLiteral(content)
    });
  });
  
  // Sort by ID
  updatedPrompts.sort((a, b) => a.id - b.id);
  
  // Generate the updated array in a format that's easy to copy-paste
  const output = `// Updated prompt templates with full markdown content
// Copy the shortDescription values below into your promptTemplates array

const updatedPromptData = [
${updatedPrompts.map(prompt => `  {
    id: ${prompt.id},
    shortDescription: \`${prompt.shortDescription}\`
  }`).join(',\n')}
];

// Or use this object for easy lookup:
const markdownContentById = {
${updatedPrompts.map(prompt => `  ${prompt.id}: \`${prompt.shortDescription}\``).join(',\n')}
};

module.exports = { updatedPromptData, markdownContentById };
`;

  fs.writeFileSync(outputFile, output);
  console.log(`\nUpdated prompt data written to: ${outputFile}`);
  console.log(`Processed ${updatedPrompts.length} files successfully`);
}

// Run the script
updatePromptTemplates();