// app/api/agent-crews/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import JSZip from 'jszip';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: error || new Error('No user found') };
    }
    
    return { user, error: null };
    
  } catch (error) {
    return { user: null, error };
  }
}

interface CrewConfig {
  id: string;
  name: string;
  description: string;
  agents: any[];
  tasks: any[];
  process: string;
  config: any;
  variables: Record<string, string>;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/\s+/g, '_')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

function generateAgentsYaml(crew: CrewConfig): string {
  let yaml = '---\n';
  
  crew.agents.forEach(agent => {
    const agentId = toSnakeCase(agent.id || agent.name);
    yaml += `${agentId}:\n`;
    yaml += `  role: ${agent.role}\n`;
    yaml += `  goal: ${agent.goal.replace(/\n/g, ' ')}\n`;
    yaml += `  backstory: ${agent.backstory.replace(/\n/g, ' ')}\n`;
  });
  
  return yaml;
}

function generateTasksYaml(crew: CrewConfig): string {
  let yaml = '---\n';
  
  crew.tasks.forEach(task => {
    const taskId = toSnakeCase(task.id || task.name || task.description.substring(0, 30));
    const agentId = toSnakeCase(task.assignedAgentId);
    
    yaml += `${taskId}:\n`;
    yaml += `  description: ${task.description.replace(/\n/g, ' ')}\n`;
    yaml += `  expected_output: ${task.expectedOutput.replace(/\n/g, ' ')}\n`;
    yaml += `  agent: ${agentId}\n`;
    
    if (task.context && task.context.length > 0) {
      yaml += `  context:\n`;
      task.context.forEach((ctx: string) => {
        yaml += `  - ${toSnakeCase(ctx)}\n`;
      });
    }
  });
  
  return yaml;
}

function generateCrewPy(crew: CrewConfig): string {
  const projectName = toSnakeCase(crew.name);
  const className = crew.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  
  // Collect unique tools
  const allTools = [...new Set(crew.agents.flatMap(a => a.tools || []))];
  const crewAiTools = allTools.filter(t => 
    ['FileReadTool', 'DirectoryReadTool', 'PDFSearchTool', 'SerperDevTool', 
     'ScrapeWebsiteTool', 'WebsiteSearchTool', 'JSONSearchTool', 'CodeInterpreterTool',
     'CSVSearchTool', 'DOCXSearchTool', 'TXTSearchTool', 'XMLSearchTool'].includes(t)
  );
  
  let code = `import os

from crewai import LLM
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
`;

  if (crewAiTools.length > 0) {
    code += `from crewai_tools import (
${crewAiTools.map(t => `    ${t}`).join(',\n')}
)
`;
  }

  code += `


@CrewBase
class ${className}Crew:
    """${crew.description || crew.name + ' crew'}"""

`;

  // Generate agent methods
  crew.agents.forEach(agent => {
    const agentId = toSnakeCase(agent.id || agent.name);
    const agentTools = (agent.tools || []).filter((t: string) => crewAiTools.includes(t));
    
    code += `    @agent
    def ${agentId}(self) -> Agent:
        
        return Agent(
            config=self.agents_config["${agentId}"],
            tools=[${agentTools.map((t: string) => `${t}()`).join(', ')}],
            reasoning=${agent.config?.reasoning || false},
            max_reasoning_attempts=${agent.config?.maxReasoningAttempts || 'None'},
            inject_date=True,
            allow_delegation=${agent.config?.allowDelegation || false},
            max_iter=${agent.config?.maxIter || 25},
            max_rpm=${agent.config?.maxRpm || 'None'},
            max_execution_time=${agent.config?.maxExecutionTime || 'None'},
            llm=LLM(
                model="${agent.llm?.model || 'openai/gpt-4o-mini'}",
                temperature=${agent.llm?.temperature || 0.7},
            ),
        )
    
`;
  });

  // Generate task methods
  crew.tasks.forEach(task => {
    const taskId = toSnakeCase(task.id || task.name || task.description.substring(0, 30));
    const contextTasks = task.context || [];
    
    code += `    @task
    def ${taskId}(self) -> Task:
        return Task(
            config=self.tasks_config["${taskId}"],
            markdown=${task.config?.markdown || false},
`;
    
    if (contextTasks.length > 0) {
      code += `            context=[${contextTasks.map((c: string) => `self.${toSnakeCase(c)}()`).join(', ')}],
`;
    }
    
    code += `        )
    
`;
  });

  // Generate crew method
  code += `    @crew
    def crew(self) -> Crew:
        """Creates the ${className} crew"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.${crew.process || 'sequential'},
            verbose=${crew.config?.verbose ?? true},
            chat_llm=LLM(model="openai/gpt-4o-mini"),
        )

`;

  return code;
}

function generateMainPy(crew: CrewConfig): string {
  const projectName = toSnakeCase(crew.name);
  const className = crew.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  
  // Extract variables from descriptions
  const variableRegex = /\{(\w+)\}/g;
  const variables = new Set<string>();
  
  crew.agents.forEach(agent => {
    let match;
    while ((match = variableRegex.exec(agent.goal)) !== null) variables.add(match[1]);
    while ((match = variableRegex.exec(agent.backstory)) !== null) variables.add(match[1]);
  });
  
  crew.tasks.forEach(task => {
    let match;
    while ((match = variableRegex.exec(task.description)) !== null) variables.add(match[1]);
    while ((match = variableRegex.exec(task.expectedOutput)) !== null) variables.add(match[1]);
  });

  const inputsObj = Array.from(variables).reduce((acc, v) => {
    acc[v] = 'sample_value';
    return acc;
  }, {} as Record<string, string>);

  return `#!/usr/bin/env python
import sys
from ${projectName}.crew import ${className}Crew

# This main file is intended to be a way for your to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    inputs = ${JSON.stringify(inputsObj, null, 8).replace(/"/g, "'")}
    ${className}Crew().crew().kickoff(inputs=inputs)


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = ${JSON.stringify(inputsObj, null, 8).replace(/"/g, "'")}
    try:
        ${className}Crew().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        ${className}Crew().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = ${JSON.stringify(inputsObj, null, 8).replace(/"/g, "'")}
    try:
        ${className}Crew().crew().test(n_iterations=int(sys.argv[1]), openai_model_name=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: main.py <command> [<args>]")
        sys.exit(1)

    command = sys.argv[1]
    if command == "run":
        run()
    elif command == "train":
        train()
    elif command == "replay":
        replay()
    elif command == "test":
        test()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
`;
}

function generatePyprojectToml(crew: CrewConfig): string {
  const projectName = toSnakeCase(crew.name);
  
  return `[project]
name = "${projectName}"
version = "0.1.0"
description = "${crew.description || projectName + ' using crewAI'}"
authors = [{ name = "Your Name", email = "you@example.com" }]
requires-python = ">=3.10,<3.14"
dependencies = [
    "crewai[litellm,tools]==1.8.0",
]

[project.scripts]
${projectName} = "${projectName}.main:run"
run_crew = "${projectName}.main:run"
train = "${projectName}.main:train"
replay = "${projectName}.main:replay"
test = "${projectName}.main:test"
run_with_trigger = "${projectName}.main:run_with_trigger"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.crewai]
type = "crew"
`;
}

function generateReadme(crew: CrewConfig): string {
  const projectName = toSnakeCase(crew.name);
  const displayName = crew.name;
  
  return `# ${displayName} Crew

${crew.description || `Welcome to the ${displayName} project, powered by crewAI.`}

## Installation

Ensure you have Python >=3.10 <3.14 installed. This project uses [UV](https://docs.astral.sh/uv/) for dependency management.

\`\`\`bash
pip install uv
\`\`\`

Install dependencies:
\`\`\`bash
crewai install
\`\`\`

### Configuration

Add your API keys to the \`.env\` file:
\`\`\`
OPENAI_API_KEY=your_key_here
\`\`\`

## Running the Project

\`\`\`bash
crewai run
\`\`\`

## Agents

${crew.agents.map(a => `- **${a.name}** - ${a.role}`).join('\n')}

## Tasks

${crew.tasks.map((t, i) => `${i + 1}. ${t.name || t.description.substring(0, 50)}...`).join('\n')}

## Support

For questions about crewAI:
- [Documentation](https://docs.crewai.com)
- [GitHub](https://github.com/joaomdmoura/crewai)
- [Discord](https://discord.com/invite/X4JWnZnxPb)
`;
}

function generateGitignore(): string {
  return `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Project specific
*.log
output/
reports/
`;
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { crew, format = 'zip' } = await req.json();

    if (!crew) {
      return NextResponse.json(
        { error: 'Missing crew configuration' },
        { status: 400 }
      );
    }

    const projectName = toSnakeCase(crew.name);

    if (format === 'zip') {
      const zip = new JSZip();
      
      // Root files
      zip.file('pyproject.toml', generatePyprojectToml(crew));
      zip.file('README.md', generateReadme(crew));
      zip.file('.gitignore', generateGitignore());
      zip.file('.env.example', 'OPENAI_API_KEY=your_key_here\n');
      
      // Source directory
      const srcFolder = zip.folder(`src/${projectName}`);
      srcFolder?.file('__init__.py', '');
      srcFolder?.file('main.py', generateMainPy(crew));
      srcFolder?.file('crew.py', generateCrewPy(crew));
      
      // Config directory
      const configFolder = srcFolder?.folder('config');
      configFolder?.file('agents.yaml', generateAgentsYaml(crew));
      configFolder?.file('tasks.yaml', generateTasksYaml(crew));
      
      // Tools directory (for custom tools)
      const toolsFolder = srcFolder?.folder('tools');
      toolsFolder?.file('__init__.py', '');
      toolsFolder?.file('custom_tool.py', `from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field


class MyCustomToolInput(BaseModel):
    """Input schema for MyCustomTool."""
    argument: str = Field(..., description="Description of the argument.")

class MyCustomTool(BaseTool):
    name: str = "Name of my tool"
    description: str = (
        "Clear description for what this tool is useful for."
    )
    args_schema: Type[BaseModel] = MyCustomToolInput

    def _run(self, argument: str) -> str:
        # Implementation goes here
        return "Tool output"
`);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

return new NextResponse(zipBuffer, {
  headers: {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${projectName}_crew.zip"`
  }
});

    } else if (format === 'json') {
      // Return structured JSON for preview
      return NextResponse.json({
        success: true,
        files: {
          'pyproject.toml': generatePyprojectToml(crew),
          'README.md': generateReadme(crew),
          '.gitignore': generateGitignore(),
          [`src/${projectName}/__init__.py`]: '',
          [`src/${projectName}/main.py`]: generateMainPy(crew),
          [`src/${projectName}/crew.py`]: generateCrewPy(crew),
          [`src/${projectName}/config/agents.yaml`]: generateAgentsYaml(crew),
          [`src/${projectName}/config/tasks.yaml`]: generateTasksYaml(crew)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error: any) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}