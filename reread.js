const fs = require('fs');
const path = require('path');

// Function to properly escape content for template literals while preserving formatting
function escapeForTemplateLiteral(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');
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
  const outputFile = './formatted-prompt-templates.js';
  
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
      content: escapeForTemplateLiteral(content)
    });
  });
  
  // Sort by ID
  updatedPrompts.sort((a, b) => a.id - b.id);
  
  // Generate the output using template literals to preserve formatting
  const output = `// Formatted markdown content extraction
// Copy these values into your promptTemplates array
// Note: Using template literals to preserve proper formatting

const markdownContentById = {
${updatedPrompts.map(prompt => `  ${prompt.id}: \`${prompt.content}\``).join(',\n\n')}
};

// Usage example:
// shortDescription: markdownContentById[1]

export { markdownContentById };
`;

  fs.writeFileSync(outputFile, output);
  console.log(`\nFormatted prompt data written to: ${outputFile}`);
  console.log(`Processed ${updatedPrompts.length} files successfully`);
  console.log(`\n💡 Tip: The content now preserves proper line breaks and formatting!`);
}

// Run the script
updatePromptTemplates();