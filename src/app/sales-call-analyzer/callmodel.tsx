// components/NewCallModal.tsx
"use client";

import { Modal, Button, Card, Typography } from 'antd';
import { useState } from 'react';
import { PlayCircleOutlined, HistoryOutlined, CloseOutlined } from '@ant-design/icons';
import { useGo } from "@refinedev/core";
const { Title, Text } = Typography;


export const NewCallModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
       const go = useGo();
  return (
    <Modal
      title="How would you like to analyze your sales call?"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      closeIcon={<CloseOutlined />}
      className="animate-fade-in-up"
    >
      <div className="space-y-4">
        <Text type="secondary">Choose the option that best fits your needs</Text>
        
        <Card 
          hoverable 
          className="border border-blue-200 hover:border-blue-300"
          onClick={() => go({ to: "/sales-call-analyzer/review-recording" })}
        >
          <div className="flex items-start">
            <HistoryOutlined className="text-blue-500 text-xl mt-1 mr-3" />
            <div>
              <Title level={5} className="mb-1">Review an existing call recording</Title>
              <Text type="secondary">Best if the call has already happened and you want in-depth feedback</Text>
            </div>
          </div>
        </Card>
        
        <Card 
          hoverable 
          className="border border-green-200 hover:border-green-300"
          onClick={onClose}
        >
          <div className="flex items-start">
            <PlayCircleOutlined className="text-green-500 text-xl mt-1 mr-3" />
            <div>
              <Title level={5} className="mb-1">Join the call live</Title>
              <Text type="secondary">Get real-time AI coaching during your sales call</Text>
            </div>
          </div>
        </Card>
        
        <div className="pt-4 flex justify-end">
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};