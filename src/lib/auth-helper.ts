// lib/auth-helper.ts
import { prisma } from '@/lib/prisma';
import { User } from '@supabase/supabase-js';

export async function ensureUserExists(supabaseUser: User) {
  try {
    console.log('🔍 Checking if user exists in database:', supabaseUser.id);
    
    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    if (existingUser) {
      console.log('✅ User already exists in database');
      return existingUser;
    }

    // User doesn't exist - create them
    console.log('📝 Creating new user in database');
    const newUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name || 
              supabaseUser.user_metadata?.name || 
              null,
        avatar: supabaseUser.user_metadata?.avatar_url || null,
        status: 'active',
        last_login: new Date()
      }
    });

    console.log('✅ User created successfully in database');
    return newUser;
    
  } catch (error: any) {
    console.error('❌ Error in ensureUserExists:', error);
    
    // If it's a unique constraint violation, user was just created by another request
    if (error.code === 'P2002') {
      console.log('User was created concurrently, fetching...');
      return await prisma.user.findUnique({
        where: { id: supabaseUser.id }
      });
    }
    
    throw error;
  }
}