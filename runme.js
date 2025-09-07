const fs = require('fs');
const { markdownContentById } = require('./updated-prompt-templates.js');

// Path to your React component
const REACT_FILE_PATH = './src/app/prompt-directory/page.tsx';

function updateReactFile() {
  try {
    let fileContent = fs.readFileSync(REACT_FILE_PATH, 'utf8');
    
    // For each prompt ID, find and replace the shortDescription
    Object.keys(markdownContentById).forEach(id => {
      const markdownContent = markdownContentById[id];
      
      // Escape content for JavaScript string literal
      const escapedContent = markdownContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');
      
      // Find the prompt object with this ID and replace shortDescription
      const promptRegex = new RegExp(
        `(\\{[^}]*?id:\\s*${id}[^}]*?shortDescription:\\s*")[^"]*?("|`)([^"]*?)("|`)`,
        'gs'
      );
      
      // Replace with template literal format
      fileContent = fileContent.replace(
        promptRegex, 
        `$1\`${escapedContent}\``
      );
      
      console.log(`Updated prompt ID ${id}`);
    });
    
    // Write the updated content back
    fs.writeFileSync(REACT_FILE_PATH, fileContent);
    console.log('\n✅ Successfully updated React file with markdown content!');
    
  } catch (error) {
    console.error('Error updating React file:', error);
  }
}

// Run the update
updateReactFile();