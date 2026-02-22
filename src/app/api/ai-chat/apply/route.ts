// app/api/ai-chat/apply/route.ts
// Non-destructive apply: creates a NEW deliverable instead of overwriting the original.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
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
    if (error || !user) return { user: null, error: error || new Error('No user found') };
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// Map deliverable type to a human-readable label for the revision title
function revisionLabel(type: string): string {
  const labels: Record<string, string> = {
    gamma_proposal: 'Proposal',
    proposal: 'Proposal',
    sales_analysis: 'Sales Analysis',
    cold_email: 'Cold Email',
    ad_copy: 'Ad Copy',
    growth_plan: 'Growth Plan',
  };
  return labels[type] || 'Deliverable';
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTH
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. PARSE BODY
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { deliverableId, workspaceId, modifiedContent, modificationSummary, mode } = body;
    const applyMode: 'overwrite' | 'new_version' = mode === 'overwrite' ? 'overwrite' : 'new_version';

    // 3. VALIDATE
    if (!deliverableId || !workspaceId || !modifiedContent) {
      return NextResponse.json(
        { success: false, error: 'deliverableId, workspaceId, and modifiedContent are required' },
        { status: 400 }
      );
    }

    // 4. VERIFY WORKSPACE OWNERSHIP
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, user_id: user.id },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found or access denied' },
        { status: 403 }
      );
    }

    // 5. LOAD THE ORIGINAL DELIVERABLE (to copy metadata, type, tags)
    const original = await prisma.deliverable.findFirst({
      where: {
        id: deliverableId,
        user_id: user.id,
        workspace_id: workspaceId,
      },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: 'Original deliverable not found or access denied' },
        { status: 404 }
      );
    }

    // ──────────────────────────────────────────────
    // MODE: OVERWRITE — update the original in place
    // ──────────────────────────────────────────────
    if (applyMode === 'overwrite') {
      let updatedContent: string;
      if (original.type === 'gamma_proposal' || original.type === 'proposal') {
        // Preserve existing JSON structure but replace the gammaPrompt
        let existing: Record<string, unknown> = {};
        try {
          existing = typeof original.content === 'string' ? JSON.parse(original.content) : (original.content as Record<string, unknown>) || {};
        } catch { /* use empty */ }
        updatedContent = JSON.stringify({ ...existing, gammaPrompt: modifiedContent });
      } else if (original.type === 'sales_analysis') {
        // Preserve analysis structure, update the content/text layer
        let existing: Record<string, unknown> = {};
        try {
          existing = typeof original.content === 'string' ? JSON.parse(original.content) : (original.content as Record<string, unknown>) || {};
        } catch { /* use empty */ }
        updatedContent = JSON.stringify({ ...existing, content: modifiedContent });
      } else {
        updatedContent = modifiedContent;
      }

      const originalMetadata = (original.metadata as Record<string, unknown>) || {};
      const updated = await prisma.deliverable.update({
        where: { id: original.id },
        data: {
          content: updatedContent,
          metadata: {
            ...originalMetadata,
            lastModifiedBy: 'ai-chat',
            lastModifiedAt: new Date().toISOString(),
            modificationSummary: modificationSummary || 'AI modification applied from chat',
          },
        },
      });

      console.log(`[ai-chat/apply] Overwrote original ${updated.id} — type: ${original.type}`);

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          title: updated.title,
          type: updated.type,
          originalId: original.id,
          originalTitle: original.title,
        },
        mode: 'overwrite',
        message: `Changes applied directly to "${original.title}".`,
      });
    }

    // ──────────────────────────────────────────────
    // MODE: NEW_VERSION — create a new revision
    // ──────────────────────────────────────────────

    // 6. COUNT EXISTING REVISIONS to generate a version number
    const existingRevisions = await prisma.deliverable.count({
      where: {
        user_id: user.id,
        workspace_id: workspaceId,
        tags: { has: `revision-of:${original.id}` },
      },
    });
    const versionNumber = existingRevisions + 2; // Original is v1, first revision is v2

    // 7. BUILD THE NEW DELIVERABLE CONTENT
    // For gamma_proposal type, wrap modified content in the expected JSON format
    let newContent: string;
    if (original.type === 'gamma_proposal' || original.type === 'proposal') {
      newContent = JSON.stringify({
        gammaPrompt: modifiedContent,
        revisedFrom: original.id,
      });
    } else {
      // For sales_analysis and other types, store as JSON with the AI-modified text
      newContent = JSON.stringify({
        content: modifiedContent,
        revisedFrom: original.id,
      });
    }

    // 8. STRIP version suffixes from original title for clean naming
    const baseTitle = original.title.replace(/\s*\(v\d+\)$/, '').replace(/\s*— Revised.*$/, '');
    const label = revisionLabel(original.type);
    const newTitle = `${baseTitle} (v${versionNumber})`;

    // 9. MERGE metadata
    const originalMetadata = (original.metadata as Record<string, unknown>) || {};
    const newMetadata = {
      ...originalMetadata,
      revisedFrom: original.id,
      revisionOf: original.title,
      versionNumber,
      modificationSummary: modificationSummary || 'AI modification applied from chat',
      appliedAt: new Date().toISOString(),
    };

    // 10. PRESERVE original tags + add revision tag
    const newTags = [
      ...original.tags.filter((t) => !t.startsWith('revision-of:')),
      `revision-of:${original.id}`,
      'ai-revised',
    ];

    // 11. CREATE THE NEW DELIVERABLE (non-destructive — original stays untouched)
    const revision = await prisma.deliverable.create({
      data: {
        title: newTitle,
        content: newContent,
        type: original.type,
        user_id: user.id,
        workspace_id: workspaceId,
        client_id: original.client_id,
        metadata: newMetadata,
        tags: newTags,
      },
    });

    console.log(
      `[ai-chat/apply] Created revision ${revision.id} (v${versionNumber}) of ${original.id} — type: ${original.type}`
    );

    return NextResponse.json({
      success: true,
      data: {
        id: revision.id,
        title: revision.title,
        type: revision.type,
        versionNumber,
        originalId: original.id,
        originalTitle: original.title,
      },
      mode: 'new_version',
      message: `New ${label} revision created — "${newTitle}". The original is preserved.`,
    });
  } catch (error) {
    console.error('[ai-chat/apply] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply changes. Please try again.' },
      { status: 500 }
    );
  }
}