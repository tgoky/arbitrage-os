"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { useUserProfile } from '../../app/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X, Save, User, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseBrowserClient as supabase } from '@/utils/supabase/client';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// --- UTILITY FUNCTIONS (KEPT INTACT) ---

const uploadImageToSupabase = async (file: File, userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
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
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }
          
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
          
          try {
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

const deleteOldAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    const urlParts = avatarUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'avatars');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
      
    if (error) console.warn('Failed to delete old avatar:', error);
  } catch (error) {
    console.warn('Error deleting old avatar:', error);
  }
};

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const BRAND_GREEN_HOVER = '#4AB08C';

const Profile = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Hooks
  const { data: identity, isLoading } = useUserProfile() as {
    data: UserProfile | undefined;
    isLoading: boolean;
  };
  const queryClient = useQueryClient();

  // State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Manrope Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Initialize Data
  useEffect(() => {
    if (identity) {
      setName(identity.name || '');
      setAvatar(identity.avatar || null);
      setPreviewUrl(identity.avatar || null);
    }
  }, [identity]);

  // Handlers
  const handleFileSelect = async (file: File) => {
    setErrorMessage('');
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPG, GIF)');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Image file size must be less than 10MB');
      return;
    }
    
    try {
      setSaveStatus('saving');
      const userIdToUse = identity?.id || '';
      
      if (!userIdToUse) {
        setErrorMessage('User not authenticated');
        setSaveStatus('idle');
        return;
      }
      
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
    if (file) handleFileSelect(file);
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
    if (file) handleFileSelect(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!identity) return;
    
    setErrorMessage('');
    setSaveStatus('saving');
    const oldAvatarUrl = identity.avatar;

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSaveStatus('success');
      
      if (oldAvatarUrl && oldAvatarUrl !== avatar && oldAvatarUrl.includes('supabase')) {
        await deleteOldAvatar(oldAvatarUrl);
      }
      
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('user') || key.includes('profile') || key.includes('identity'))
          );
        }
      });
      
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      setErrorMessage(error?.message || 'Failed to update profile.');
      
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const getUserInitial = () => {
    return name?.charAt(0).toUpperCase() || identity?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-[#5CC49D] animate-spin" />
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-manrope selection:bg-[#5CC49D] selection:text-black">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        
        {/* Header - UPDATED SECTION */}
      <div className="mb-10">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 mb-6
                   bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white
                   text-sm font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Profile Settings</h1>
            <p className="text-zinc-500">Manage your personal information and appearance</p>
          </div>
        </div>
      </div>

        {/* Status Messages */}
        {(saveStatus === 'success' || saveStatus === 'error' || errorMessage) && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300 ${
            saveStatus === 'success' 
              ? 'bg-[#5CC49D]/10 border-[#5CC49D]/30 text-[#5CC49D]' 
              : 'bg-red-900/10 border-red-900/30 text-red-400'
          }`}>
            {saveStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium text-sm">
              {saveStatus === 'success' 
                ? 'Profile updated successfully!' 
                : errorMessage || 'Failed to update profile. Please try again.'}
            </span>
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/20">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Profile Picture</h2>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              
              {/* Avatar Preview */}
              <div className="flex-shrink-0 relative group">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-black ring-2 ${previewUrl ? 'ring-[#5CC49D]' : 'ring-zinc-700'}`}>
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 font-bold text-4xl">
                      {getUserInitial()}
                    </div>
                  )}
                </div>
                
                {previewUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute top-0 right-0 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="flex-1 w-full">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer h-32 flex flex-col items-center justify-center
                    ${isDragOver 
                      ? 'border-[#5CC49D] bg-[#5CC49D]/5' 
                      : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={saveStatus === 'saving'}
                  />
                  
                  {saveStatus === 'saving' ? (
                    <div className="flex flex-col items-center text-[#5CC49D]">
                      <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                      <span className="text-sm font-medium">Processing image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-1">
                        <Upload className="w-4 h-4 text-[#5CC49D]" />
                        <span>Click to upload or drag and drop</span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        SVG, PNG, JPG or GIF (max. 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/20">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Personal Information</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black border border-zinc-800 rounded-lg focus:outline-none focus:border-[#5CC49D] focus:ring-1 focus:ring-[#5CC49D] text-white placeholder-zinc-600 transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                Email Address
              </label>
              <div className="relative opacity-60">
                <input
                  type="email"
                  value={identity?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5CC49D]"></span>
                  <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wide">Verified</span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 mt-2 ml-1">
                Managed by authentication provider. Cannot be changed manually.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-[0_0_20px_rgba(92,196,157,0.1)]
              ${saveStatus === 'success'
                ? 'bg-[#5CC49D] text-black hover:bg-[#4AB08C]'
                : 'bg-[#5CC49D] text-black hover:bg-[#4AB08C] hover:scale-105 active:scale-95'}
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            `}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;