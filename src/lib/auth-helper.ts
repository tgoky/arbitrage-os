// lib/auth-helpers.ts
import { prisma } from '@/lib/prisma';
import { User } from '@supabase/supabase-js';

export async function ensureUserExists(supabaseUser: User) {
  try {
    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    if (!existingUser) {
      // Create user in our database
      return await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || null,
          avatar: supabaseUser.user_metadata?.avatar_url || null,
        }
      });
    }

    return existingUser;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}