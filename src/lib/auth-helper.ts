// lib/auth-helper.ts
import { prisma } from '@/lib/prisma';
import { User } from '@supabase/supabase-js';

export async function ensureUserExists(supabaseUser: User) {
  try {
    console.log('🔍 ensureUserExists called for:', supabaseUser.id);
    console.log('Email:', supabaseUser.email);
    
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    if (existingUser) {
      console.log('  User found in database');
      return existingUser;
    }

    console.log('⚠️ User NOT found, creating...');
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

    console.log('  User created successfully:', newUser.id);
    return newUser;
    
  } catch (error: any) {
    console.error('  ensureUserExists ERROR:', error);
    console.error('Error code:', error.code);
    console.error('Error details:', error.message);
    
    if (error.code === 'P2002') {
      console.log('Concurrent creation detected, fetching...');
      const user = await prisma.user.findUnique({
        where: { id: supabaseUser.id }
      });
      if (user) return user;
    }
    
    throw error;
  }
}