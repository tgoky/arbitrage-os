// app/api/agent-crews/templates/route.ts
import { NextResponse } from 'next/server';
import { CrewTemplates } from '@/services/agent-runtime/UniversalAgentPlatform';

export async function GET() {
  const templates = CrewTemplates.getAllTemplates();

  return NextResponse.json({
    success: true,
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      agents: t.agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        goal: a.goal,
        toolCount: a.tools.length
      })),
      tasks: t.tasks.map(t => ({
        id: t.id,
        description: t.description,
        expectedOutput: t.expectedOutput
      })),
      process: t.process
    }))
  });
}