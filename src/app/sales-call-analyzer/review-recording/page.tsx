// app/sales-call-analyzer/review-recording.tsx
"use client";

import { 
  Button, 
  Card, 
  Typography, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  message 
} from 'antd';
import { 
  UploadOutlined, 
  CloseOutlined,
  LinkOutlined,
  UserOutlined,
  BankOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";

import { useState } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function ReviewRecordingPage() {
  const go = useGo();
  const [fileList, setFileList] = useState([]);

  const handleUpload = (info) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); // Limit to 1 file
    setFileList(fileList);
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Title level={3}>Review Sales Call Recording</Title>
        <Button 
          icon={<CloseOutlined />} 
          onClick={() => go({ to: "/sales-call-analyzer" })}
        >
          Cancel
        </Button>
      </div>
      
      <Text type="secondary" className="block mb-6">
        Upload your sales call recording to get AI-powered analysis and feedback.
      </Text>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Call Type" className="h-full">
          <Select defaultValue="discovery" className="w-full">
            <Option value="discovery">Discovery Call</Option>
            <Option value="interview">Interview Call</Option>
            <Option value="sales">Sales Call</Option>
            <Option value="podcast">Podcast Call</Option>
          </Select>
          
          <div className="mt-4">
            <Text strong className="block mb-2">Date</Text>
            <DatePicker className="w-full" />
          </div>
        </Card>
        
        <Card title="Prospect Information" className="h-full">
          <div className="space-y-4">
            <Input prefix={<UserOutlined />} placeholder="Name" />
            <Input prefix={<UserOutlined />} placeholder="Title (e.g. VP of Sales)" />
            <Input prefix={<UserOutlined />} placeholder="Email" />
            <Input prefix={<LinkOutlined />} placeholder="LinkedIn URL" />
          </div>
        </Card>
        
        <Card title="Company Information" className="h-full">
          <div className="space-y-4">
            <Input prefix={<BankOutlined />} placeholder="Company Name" />
            <Input prefix={<LinkOutlined />} placeholder="Website" />
            <Input prefix={<BankOutlined />} placeholder="Industries (Software, Healthcare, etc.)" />
            <div className="grid grid-cols-2 gap-4">
              <Select placeholder="Headcount range">
                <Option value="1-10">1-10</Option>
                <Option value="11-50">11-50</Option>
                <Option value="51-200">51-200</Option>
                <Option value="201-500">201-500</Option>
                <Option value="501-1000">501-1000</Option>
                <Option value="1000+">1000+</Option>
              </Select>
              <Select placeholder="Revenue range">
                <Option value="0-1M">$0-$1M</Option>
                <Option value="1M-10M">$1M-$10M</Option>
                <Option value="10M-50M">$10M-$50M</Option>
                <Option value="50M-100M">$50M-$100M</Option>
                <Option value="100M+">$100M+</Option>
              </Select>
            </div>
            <Input prefix={<EnvironmentOutlined />} placeholder="Location" />
            <Input prefix={<LinkOutlined />} placeholder="LinkedIn Company Page" />
          </div>
        </Card>
      </div>
      
      <Card title="Upload Recording" className="mb-6">
        <Upload.Dragger
          fileList={fileList}
          onChange={handleUpload}
          beforeUpload={() => false}
          accept=".mp3,.wav,.m4a,.aac,.ogg,.wma,.flac"
          maxCount={1}
          className="py-8"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined className="text-3xl" />
          </p>
          <p className="ant-upload-text">Drag & drop your recording here, or click to select</p>
          <p className="ant-upload-hint">
            Supports audio files (MP3, WAV, M4A, AAC, OGG, WMA, FLAC) up to 500MB
          </p>
        </Upload.Dragger>
        
        <div className="mt-4">
          <Text strong>Or paste transcript</Text>
          <TextArea 
            rows={4} 
            placeholder="Paste the call transcript here if you have it..." 
            className="mt-2"
          />
        </div>
      </Card>
      
      <Card title="Additional Context" className="mb-6">
        <TextArea 
          rows={4} 
          placeholder="Add any specific questions you want answered, areas you want analyzed, or additional context about this call..." 
        />
        <Text type="secondary" className="block mt-2">
          The AI will analyze these specific points and provide targeted insights based on your questions.
        </Text>
      </Card>
      
      <div className="flex justify-end space-x-4">
        <Button onClick={() => go({ to: "/sales-call-analyzer" })}>
          Cancel
        </Button>
        <Button type="primary">
          Submit for Analysis
        </Button>
      </div>
    </div>
  );
}