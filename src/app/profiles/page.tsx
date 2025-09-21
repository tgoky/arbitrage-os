"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useUserProfile } from '../../app/hooks/useUserProfile'; // Use your React Query hook instead
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X, Save, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}


// Initialize Supabase client with proper auth context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

interface UserIdentity {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// Utility function to compress and upload image to Supabase Storage
const uploadImageToSupabase = async (file: File, userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Resize image to max 400x400 to reduce file size
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }
          
          // Generate unique filename
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
          
          try {
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                cacheControl: '3600',
                upsert: true
              });
            
            if (error) {
              console.error('Supabase upload error:', error);
              reject(new Error(`Upload failed: ${error.message}`));
              return;
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            resolve(publicUrl);
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            reject(new Error('Failed to upload image'));
          }
        }, 'image/jpeg', 0.8);
      } catch (processError) {
        console.error('Image processing error:', processError);
        reject(new Error('Failed to process image'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Utility function to delete old avatar from storage
const deleteOldAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    // Extract file path from public URL
    const urlParts = avatarUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'avatars');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
      
    if (error) {
      console.warn('Failed to delete old avatar:', error);
      // Don't throw error as this is not critical
    }
  } catch (error) {
    console.warn('Error deleting old avatar:', error);
  }
};

const Profile = () => {
  const { theme } = useTheme();
  const router = useRouter();
const { data: identity, isLoading } = useUserProfile() as {
  data: UserProfile | undefined;
  isLoading: boolean;
};
 // Use React Query hook
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (identity) {
      setName(identity.name || '');
      setAvatar(identity.avatar || null);
      setPreviewUrl(identity.avatar || null);
    }
  }, [identity]);

  const handleFileSelect = async (file: File) => {
    // Reset any previous errors
    setErrorMessage('');
    
    // File type validation
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }
    
    // File size validation (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Image file size must be less than 10MB');
      return;
    }
    
    try {
      setSaveStatus('saving');
      
      // Use the identity user ID directly since Supabase session is not available
      const userIdToUse = identity?.id || '';
      
      if (!userIdToUse) {
        setErrorMessage('User not authenticated');
        setSaveStatus('idle');
        return;
      }
      
      // Compress and upload the image to Supabase Storage
      const uploadedImageUrl = await uploadImageToSupabase(file, userIdToUse);
      
      setPreviewUrl(uploadedImageUrl);
      setAvatar(uploadedImageUrl);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMessage('Failed to process image. Please try again.');
      setSaveStatus('idle');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!identity) return;
    
    // Reset any previous errors
    setErrorMessage('');
    setSaveStatus('saving');

    // Store old avatar URL for cleanup
    const oldAvatarUrl = identity.avatar;

    try {
      // Use our custom API route instead of Refine data provider
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile updated successfully:', result);
      setSaveStatus('success');
      
      // Clean up old avatar if it exists and is different from new one
      if (oldAvatarUrl && oldAvatarUrl !== avatar && oldAvatarUrl.includes('supabase')) {
        await deleteOldAvatar(oldAvatarUrl);
      }
      
      // Invalidate React Query queries to refresh user data across the app
      queryClient.invalidateQueries({ 
        queryKey: ['userProfile'] 
      });
      
      // Also invalidate identity-related queries (if using React Query for identity)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          // Invalidate any query that might contain user profile data
          return query.queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('user') || key.includes('profile') || key.includes('identity'))
          );
        }
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      
      // Set user-friendly error message
      const errorMsg = error?.message || 'Failed to update profile. Please try again.';
      setErrorMessage(errorMsg);
      
      // Reset error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const getUserInitial = () => {
    return name?.charAt(0).toUpperCase() || 
           identity?.email?.charAt(0).toUpperCase() || 
           'U';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-300 rounded-lg"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your account settings and profile information
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
        </div>

        {/* Status Messages */}
        {(saveStatus === 'success' || saveStatus === 'error' || errorMessage) && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus === 'success' 
              ? theme === 'dark' ? 'bg-green-900/20 border border-green-800 text-green-400' : 'bg-green-50 border border-green-200 text-green-800'
              : theme === 'dark' ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Profile updated successfully!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage || 'Failed to update profile. Please try again.'}</span>
              </>
            )}
          </div>
        )}

        {/* Profile Picture Section */}
        <div className={`p-6 rounded-lg border mb-6 ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          
          <div className="flex items-start gap-6">
            {/* Current Avatar */}
            <div className="flex-shrink-0">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Profile"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                  {getUserInitial()}
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? theme === 'dark' ? 'border-indigo-500 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50'
                    : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <Upload className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Drag and drop your image here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saveStatus === 'saving'}
                      className={`text-indigo-500 hover:text-indigo-600 underline ${
                        saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      browse
                    </button>
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    PNG, JPG, GIF up to 10MB. Images will be automatically optimized.
                  </p>
                  {saveStatus === 'saving' && (
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      Processing and uploading image...
                    </p>
                  )}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className={`p-6 rounded-lg border mb-6 ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                User name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                value={identity?.email || ''}
                disabled
                className={`w-full px-3 py-2 border rounded-lg cursor-not-allowed ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-gray-400 placeholder-gray-500' 
                    : 'bg-gray-100 border-gray-300 text-gray-500 placeholder-gray-400'
                }`}
                placeholder="Email managed by authentication"
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Email address is already authenticated and cannot be changed here.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              saveStatus === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;