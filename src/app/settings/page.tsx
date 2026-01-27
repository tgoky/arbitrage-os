"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid, Form, Input, Button, Divider, Avatar, message, ConfigProvider, theme as antTheme, Spin } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  DeleteOutlined,
  CheckOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspace } from '../hooks/useWorkspace';



const { useBreakpoint } = Grid;
const { TextArea } = Input;

// --- STYLING CONSTANTS (ALL BLACK THEME) ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';      // Pure Black Background
const SURFACE_BG = '#000000';   // Pure Black Cards
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400
const BORDER_COLOR = '#27272a';   // Zinc-800 (Crucial for separation on black)

const WorkspaceSettings = () => {
  const params = useParams();
  const router = useRouter();
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const workspaceSlug = params?.workspace as string;
  
  // 1. HOOKS
  const { 
    currentWorkspace, 
    isLoading, 
    updateWorkspace, 
    deleteWorkspace
  } = useWorkspace();

  const [form] = Form.useForm();
  
  // Watch color state for preview
  const watchedColor = Form.useWatch('color', form);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Update form when workspace data changes
  React.useEffect(() => {
    if (currentWorkspace) {
      form.setFieldsValue({
        name: currentWorkspace.name,
        description: currentWorkspace.description || '',
        color: currentWorkspace.color || '#3B82F6',
      });
    }
  }, [currentWorkspace, form]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!currentWorkspace) return;
    
    setIsSubmitting(true);
    try {
      await updateWorkspace(currentWorkspace.id, values);
      message.success('Workspace updated successfully!');
    } catch (error) {
      console.error('Error updating workspace:', error);
      message.error('Error updating workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle workspace deletion
  const handleDelete = async () => {
    if (!currentWorkspace) return;
    
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteWorkspace(currentWorkspace.id);
      message.success('Workspace deleted successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      message.error('Error deleting workspace. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  // 2. EARLY RETURNS
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">



<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>

    <Spin size="large" />

</ConfigProvider>

      
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-manrope">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Workspace Not Found</h1>
          <p className="mb-8 text-gray-400">
            The workspace {workspaceSlug} could not be found.
          </p>
          <Button
            type="primary"
            onClick={() => router.push('/')}
            style={{ backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
          >
            Go to Workspaces
          </Button>
        </div>
      </div>
    );
  }

  // 3. MAIN RENDER
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG, // Pure Black Cards
          colorBgElevated: '#0a0a0a',   // Slightly lighter for dropdowns
          colorBorder: BORDER_COLOR,
          controlOutline: 'none',       // Remove blue glow
        },
        components: {
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBg: '#000000',
            defaultBorderColor: BORDER_COLOR,
            defaultColor: TEXT_PRIMARY,
          },
          Input: {
            paddingBlock: 12, // Taller, premium inputs
            colorBgContainer: '#000000',
            colorBorder: BORDER_COLOR,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorTextPlaceholder: '#52525b', // Zinc-600
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorBorder: BORDER_COLOR,
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope text-zinc-200">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="mb-8">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              type="text"
              className="mb-4 text-zinc-500 hover:text-white pl-0 transition-colors"
            >
              Back to Dashboard
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Workspace Settings</h1>
                <p className="text-zinc-500">Manage your workspace details and preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* General Settings Card */}
              <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 bg-black">
                   <h2 className="text-lg font-bold text-white m-0">General Information</h2>
                </div>
                
                <div className="p-6">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                      name: currentWorkspace.name,
                      description: currentWorkspace.description || '',
                      color: currentWorkspace.color || '#3B82F6',
                    }}
                  >
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                      <div className="flex-shrink-0 flex flex-col items-center">
                         <div className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Icon Preview</div>
                        <Avatar
                          size={80}
                          style={{ 
                            backgroundColor: watchedColor || currentWorkspace.color,
                            fontSize: '32px',
                            fontWeight: '800',
                            fontFamily: 'Manrope',
                            color: '#fff',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {currentWorkspace.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </div>
                      
                      <div className="flex-grow">
                        <Form.Item
                          label={<span className="text-zinc-300 font-medium">Brand Color</span>}
                          name="color"
                        >
                          <div className="flex flex-wrap gap-3">
                            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#5CC49D'].map(color => {
                              const isSelected = watchedColor === color;
                              return (
                                <div
                                  key={color}
                                  className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center ${
                                    isSelected 
                                      ? 'ring-2 ring-white ring-offset-4 ring-offset-black scale-110' 
                                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => form.setFieldValue('color', color)}
                                >
                                  {isSelected && <CheckOutlined style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }} />}
                                </div>
                              );
                            })}
                          </div>
                        </Form.Item>
                      </div>
                    </div>
                    
                    <Form.Item
                      label={<span className="text-zinc-300 font-medium">Workspace Name</span>}
                      name="name"
                      rules={[{ required: true, message: 'Please enter a workspace name' }]}
                    >
                      <Input 
                        placeholder="e.g. Acme Corp" 
                        className="rounded-lg font-medium bg-black"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label={<span className="text-zinc-300 font-medium">Description</span>}
                      name="description"
                    >
                      <TextArea 
                        rows={4} 
                        placeholder="What is this workspace used for?" 
                        className="rounded-lg bg-black"
                      />
                    </Form.Item>
                    
                    <div className="pt-6 border-t border-zinc-800 flex justify-end">
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large"
                        icon={<SaveOutlined />}
                        loading={isSubmitting}
                        className="px-8 h-12 rounded-lg font-bold"
                        style={{
                          boxShadow: `0 0 20px ${BRAND_GREEN}20` // Subtle green glow
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="bg-black rounded-xl border border-red-900/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-900/20 bg-red-950/5">
                   <h2 className="text-lg font-bold text-red-500 m-0">Danger Zone</h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="font-bold text-zinc-200 text-lg mb-1">Delete this workspace</div>
                      <div className="text-zinc-500 max-w-md text-sm leading-relaxed">
                        Once you delete a workspace, there is no going back. All projects, settings, and data will be permanently removed.
                      </div>
                    </div>
                    <Button 
                      danger 
                      size="large"
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      onClick={handleDelete}
                      className="bg-black border-red-900/50 text-red-500 hover:bg-red-950/20 hover:border-red-500 h-11"
                    >
                      Delete Workspace
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden p-6 sticky top-6">
                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <InfoCircleOutlined className="text-zinc-500" />
                  Details
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                      Workspace ID
                    </div>
                    <div className="font-mono text-xs text-zinc-400 bg-zinc-900/50 p-3 rounded border border-zinc-800 break-all select-all">
                      {currentWorkspace.id}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                      Slug
                    </div>
                    <div className="font-mono text-sm text-brand-green">
                      {currentWorkspace.slug}
                    </div>
                  </div>

                  <Divider className="border-zinc-800 my-4" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Created
                      </div>
                      <div className="text-sm text-zinc-300">
                        {currentWorkspace.created_at ? new Date(currentWorkspace.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Updated
                      </div>
                      <div className="text-sm text-zinc-300">
                        {currentWorkspace.updated_at ? new Date(currentWorkspace.updated_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default WorkspaceSettings;