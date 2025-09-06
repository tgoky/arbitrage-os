"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid, Card, Form, Input, Button, Tag, Divider, Avatar, Upload, message } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  UploadOutlined, 
  DeleteOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useWorkspace } from '../hooks/useWorkspace';
import { workspaceService } from '../../services/workspace.service';

const { useBreakpoint } = Grid;
const { TextArea } = Input;

const WorkspaceSettings = () => {
  const params = useParams();
  const router = useRouter();
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const workspaceSlug = params?.workspace as string;
  
  // Use the workspace hook - now includes updateWorkspace
  const { 
    currentWorkspace, 
    workspaces, 
    isLoading, 
    updateWorkspace, // This is now available from the hook
    switchWorkspace,
    deleteWorkspace
  } = useWorkspace();

  // Form state
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Update form when workspace data changes
  React.useEffect(() => {
    if (currentWorkspace) {
      form.setFieldsValue({
        name: currentWorkspace.name,
        description: currentWorkspace.description || '',
        color: currentWorkspace.color || '#3B82F6',
      });
      
      // Set logo preview if exists
      if (currentWorkspace.image) {
        setLogoPreview(currentWorkspace.image);
      }
    }
  }, [currentWorkspace, form]);

  // Handle form submission with image upload
  const handleSubmit = async (values: any) => {
    if (!currentWorkspace) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = currentWorkspace.image; // Keep existing image by default
      
      // If a new logo file was selected, upload it first
      if (logoFile) {
        try {
          imageUrl = await workspaceService.uploadImage(logoFile);
          message.success('Image uploaded successfully!');
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          message.error('Failed to upload image. Saving other changes...');
          // Continue with update even if image upload fails
        }
      }
      
      // Update workspace with new values (including image if uploaded)
      await updateWorkspace(currentWorkspace.id, {
        ...values,
        image: imageUrl
      });
      
      message.success('Workspace updated successfully!');
      
      // Clear the logo file state since it's now saved
      setLogoFile(null);
      
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

  // Handle logo upload
  const handleLogoChange = (info: any) => {
    const file = info.file;
    const isImage = file.type.startsWith('image/');
    
    if (!isImage) {
      message.error('You can only upload image files!');
      return;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return;
    }
    
    // Set file for later upload
    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    message.info('Image selected. Click "Save Changes" to upload and save.');
  };


    const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };
  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    message.info('Logo will be removed when you save changes.');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workspace Not Found</h1>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            The workspace {workspaceSlug} could not be found.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            type="text"
            className={`mr-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* General Settings Card */}
            <Card 
              className={`mb-6 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : ''}`}
              title="General Settings"
            >
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
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <div className="text-sm font-medium mb-2">Workspace Logo</div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar
                          size={64}
                          src={logoPreview || currentWorkspace.image}
                          style={{ 
                            backgroundColor: form.getFieldValue('color') || currentWorkspace.color,
                            fontSize: '24px',
                            fontWeight: 'bold'
                          }}
                        >
                          {currentWorkspace.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Upload
                          name="logo"
                          showUploadList={false}
                          beforeUpload={() => false}
                          onChange={handleLogoChange}
                          accept="image/*"
                        >
                          <Button 
                            icon={<UploadOutlined />} 
                            size="small" 
                            className="absolute -bottom-1 -right-1"
                            shape="circle"
                          />
                        </Upload>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          JPG, PNG or GIF. Max 2MB.
                        </div>
                        {(logoPreview || currentWorkspace.image) && (
                          <Button 
                            size="small" 
                            danger 
                            type="link"
                            onClick={handleRemoveLogo}
                          >
                            Remove Logo
                          </Button>
                        )}
                        {logoFile && (
                          <div className="text-xs text-amber-600">
                            New image selected - save to upload
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <Form.Item
                      label="Workspace Color"
                      name="color"
                    >
                      <div className="flex flex-wrap gap-2">
                        {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
                          <div
                            key={color}
                            className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                              form.getFieldValue('color') === color ? 'border-white ring-2 ring-blue-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => form.setFieldValue('color', color)}
                          />
                        ))}
                      </div>
                    </Form.Item>
                  </div>
                </div>
                
                <Form.Item
                  label="Workspace Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter a workspace name' }]}
                >
                  <Input 
                    placeholder="Enter workspace name" 
                    className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
                  />
                </Form.Item>
                
                <Form.Item
                  label="Description"
                  name="description"
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Describe your workspace" 
                    className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />}
                    loading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Danger Zone Card */}
            <Card 
              className={theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : ''}
              title={
                <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                  Danger Zone
                </span>
              }
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-medium">Delete this workspace</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Once you delete a workspace, there is no going back. Please be certain.
                  </div>
                </div>
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                  onClick={handleDelete}
                >
                  Delete Workspace
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card 
              className={`sticky top-6 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : ''}`}
              title="Workspace Information"
            >
              <div className="space-y-4">
                <div>
                  <div className={`text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Workspace ID
                  </div>
                  <div className="font-mono text-sm">{currentWorkspace.id}</div>
                </div>
                
                <Divider className={theme === 'dark' ? 'bg-zinc-800' : ''} />
                
                <div>
                  <div className={`text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Created At
                  </div>
                  <div className="text-sm">
                    {currentWorkspace.created_at ? new Date(currentWorkspace.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                
                <div>
                  <div className={`text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Last Updated
                  </div>
                  <div className="text-sm">
                    {currentWorkspace.updated_at ? new Date(currentWorkspace.updated_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                
                <Divider className={theme === 'dark' ? 'bg-zinc-800' : ''} />
                
                <div>
                  <div className={`text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                    Members
                  </div>
                  <div className="flex -space-x-2">
                    <Avatar size="small" style={{ backgroundColor: '#3B82F6' }}>U</Avatar>
                    <Avatar size="small" style={{ backgroundColor: '#10B981' }}>T</Avatar>
                    <Avatar size="small" style={{ backgroundColor: '#F59E0B' }}>H</Avatar>
                    <Button 
                      size="small" 
                      type="text" 
                      icon={<PlusOutlined />}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-zinc-800 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;