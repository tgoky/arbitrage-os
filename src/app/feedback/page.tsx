"use client";

import { useState, useEffect } from 'react';
import { useGetIdentity } from "@refinedev/core";
import { useTheme } from "../../providers/ThemeProvider";
import Head from 'next/head';
import Script from 'next/script';
import {
  Layout,
  Card,
  Button,
  Input,
  Tabs,
  Radio,
  Space,
  Avatar,
  Typography,
  Row,
  Col,
  Badge,
  Divider,
  Alert,
  Spin,
  Tag,
  theme
} from 'antd';
import {
  MessageOutlined,
  CustomerServiceOutlined,
  BulbOutlined,
  SearchOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  BugOutlined,
  CommentOutlined,
  FileTextOutlined,
  RocketOutlined,
  StarOutlined,
  FireOutlined
} from '@ant-design/icons';

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

import { useRouter } from 'next/navigation';


const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// TypeScript declaration for FeatureBase
declare global {
  interface Window {
    Featurebase: any;
  }
}

interface UserIdentity {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [filter, setFilter] = useState('all');
  const [feedbackWidgetReady, setFeedbackWidgetReady] = useState(false);
  const [messengerReady, setMessengerReady] = useState(false);
  const { theme: appTheme } = useTheme();
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
      const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
       const router = useRouter();

  const { token } = theme.useToken();

  // Initialize widgets when component mounts - KEEPING ORIGINAL LOGIC INTACT
  useEffect(() => {
    const initializeWidgets = () => {
      console.log('Initializing FeatureBase widgets...');
      const win = window as any;

      if (typeof win.Featurebase !== "function") {
        win.Featurebase = function () {
          (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
        };
      }

      // Initialize Feedback Widget
      win.Featurebase(
        'initialize_feedback_widget',
        {
          organization: 'growai',
          theme: appTheme === 'dark' ? 'dark' : 'light',
          email: identity?.email || '',
          name: identity?.name || '',
          locale: 'en',
        },
        (err: any, callback: any) => {
          console.log('Feedback widget callback:', { err, callback });
          
          if (err) {
            console.error('Feedback widget error:', err);
          }
          
          if (callback?.action === 'widgetReady') {
            console.log('Feedback widget ready!');
            setFeedbackWidgetReady(true);
          }
          
          if (callback?.action === 'feedbackSubmitted') {
            console.log('Feedback submitted:', callback.post);
          }
        }
      );

      // Initialize Messenger Widget
      win.Featurebase("boot", {
       appId: process.env.NEXT_PUBLIC_ARBITRAGEOS_APP_ID , // Replace with your actual appId from dashboard
        email: identity?.email || '',
        userId: identity?.id || '',
        createdAt: new Date().toISOString(), // User's account creation date
        theme: appTheme === 'dark' ? 'dark' : 'light',
        language: 'en',
        // Add custom user data
        userName: identity?.name || '',
        userAvatar: identity?.avatar || '',
        // userHash: 'YOUR_USER_HASH', // Add if identity verification is enabled
      });

      // Initialize Embedded Portal
      win.Featurebase("init_embed_widget", {
        organization: "growai",
        embedOptions: {
          path: "/",
          filters: "",
        },
        stylingOptions: {
          theme: appTheme === 'dark' ? 'dark' : 'light',
          hideMenu: false,
          hideLogo: false,
        },
        user: {
          metadata: {
            userId: identity?.id || '',
            userName: identity?.name || '',
            userEmail: identity?.email || '',
          }
        },
        locale: "en"
      });

      // Set messenger as ready immediately since boot doesn't have callbacks like initialize_feedback_widget
      setMessengerReady(true);
    };

    // Initialize when user data is available
    if (identity && !isLoading) {
      const timer = setTimeout(initializeWidgets, 500);
      return () => clearTimeout(timer);
    }
  }, [identity, appTheme, isLoading]);

  // KEEPING ORIGINAL HANDLERS INTACT
  const handleFeedbackWidget = (boardType?: string) => {
    if (!identity) {
      alert('Please log in to submit feedback');
      return;
    }

    if (!feedbackWidgetReady) {
      alert('Feedback widget is still loading. Please try again in a moment.');
      return;
    }

    // If specific board is requested, use postMessage to specify it
    if (boardType) {
      window.postMessage({
        target: 'FeaturebaseWidget',
        data: { 
          action: 'openFeedbackWidget',
          setBoard: boardType
        }
      });
    }

    console.log('Opening feedback widget with board:', boardType || 'default');
  };

  const handleMessenger = () => {
    if (!identity) {
      alert('Please log in to open messenger');
      return;
    }

    if (!messengerReady) {
      alert('Messenger is still loading. Please wait a moment.');
      return;
    }

    try {
      (window as any).Featurebase('show');
      console.log('Opening FeatureBase messenger...');
    } catch (e) {
      console.error('Failed to open messenger:', e);
      alert('Failed to open messenger. Please try again.');
    }
  };

  const tabItems = [
    {
      key: 'new',
      label: (
        <Space>
          <StarOutlined />
          New
        </Space>
      )
    },
    {
      key: 'top',
      label: (
        <Space>
          <RocketOutlined />
          Top
        </Space>
      )
    },
    {
      key: 'trending',
      label: (
        <Space>
          <FireOutlined />
          Trending
        </Space>
      )
    }
  ];


     const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };


  const filterOptions = [
    { 
      value: 'all', 
      label: 'All Feedback', 
      icon: <FileTextOutlined />,
      color: 'default' as const
    },
    { 
      value: 'feature-request', 
      label: 'Feature Requests', 
      icon: <BulbOutlined />,
      color: 'gold' as const
    },
    { 
      value: 'bug-reports', 
      label: 'Bug Reports', 
      icon: <BugOutlined />,
      color: 'red' as const
    },
    { 
      value: 'general', 
      label: 'General Feedback', 
      icon: <CommentOutlined />,
      color: 'blue' as const
    }
  ];

  return (
    <div>
        <Button style={{ left: 15}} 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
      // negative margin top
      >
        Back
      </Button>
      
    <Layout style={{ minHeight: '100vh', background: appTheme === 'dark' ? '#000000' : '#f5f5f5' }}>
        
      <Head>
        <title>Feedback & Feature Requests | Your App</title>
        <meta name="description" content="Share your feedback and feature requests to help us improve our product." />
      </Head>

      {/* Load FeatureBase SDK */}
      <Script 
        src="https://do.featurebase.app/js/sdk.js" 
        id="featurebase-sdk"
        strategy="afterInteractive"
      />

      <Content style={{ padding: '24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Title level={1} style={{ marginBottom: 16, fontSize: '2.5rem', fontWeight: 700 }}>
              💬 Have something to say?
            </Title>
            <Paragraph style={{ fontSize: '1.2rem', maxWidth: 600, margin: '0 auto' }}>
              Tell us how we could make ArbitrageOS more useful to you.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {/* Main Content */}
            <Col xs={24} lg={16}>
              {/* Action Buttons - Most Important */}
              <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12}>
                  <Button
                    type="primary"
                    size="large"
                    icon={feedbackWidgetReady ? <BulbOutlined /> : <LoadingOutlined spin />}
                    onClick={() => handleFeedbackWidget()}
                    disabled={!identity || isLoading || !feedbackWidgetReady}
                    style={{ 
                      width: '100%', 
                      height: 64,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                    }}
                    data-featurebase-feedback
                  >
                    {!identity ? 'Login Required' : !feedbackWidgetReady ? 'Loading...' : 'Submit Feedback'}
                  </Button>
                </Col>
                <Col xs={24} sm={12}>
                  <Button
                    type="primary"
                    size="large"
                    icon={messengerReady ? <CustomerServiceOutlined /> : <LoadingOutlined spin />}
                    onClick={handleMessenger}
                    disabled={!identity || isLoading || !messengerReady}
                    style={{ 
                      width: '100%', 
                      height: 64,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {!identity ? 'Login Required' : !messengerReady ? 'Loading Messenger...' : 'Open Chat Support'}
                  </Button>
                </Col>
              </Row>

              {/* User Status Card */}
              {identity && (
                <Card 
                  style={{ 
                    marginBottom: 24,
                    borderRadius: 16,
                    background: appTheme === 'dark' 
                      ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Row align="middle" gutter={16}>
                    <Col>
                      {identity.avatar ? (
                        <Avatar size={56} src={identity.avatar} />
                      ) : (
                        <Avatar 
                          size={56} 
                          style={{ 
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                          }}
                        >
                          {identity.name?.charAt(0).toUpperCase() || identity.email?.charAt(0).toUpperCase() || <UserOutlined />}
                        </Avatar>
                      )}
                    </Col>
                    <Col flex={1}>
                      <Title level={4} style={{ margin: 0 }}>
                        Welcome, {identity.name || 'User'}!
                      </Title>
                      <Text type="secondary">{identity.email}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          {/* <Badge 
                            status={feedbackWidgetReady ? "success" : "processing"} 
                            // text={`Feedback Widget: ${feedbackWidgetReady ? 'Ready' : 'Loading...'}`}
                          />
                          <Badge 
                            status={messengerReady ? "success" : "processing"} 
                            text={`Messenger: ${messengerReady ? 'Ready' : 'Loading...'}`}
                          /> */}
                        </Space>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* Tabs */}
              <Card 
                style={{ 
                  marginBottom: 24,
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Tabs 
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems}
                  size="large"
                  style={{ marginBottom: 16 }}
                />
                
                <Search
                  placeholder="Search feedback..."
                  size="large"
                  prefix={<SearchOutlined />}
                  style={{ marginBottom: 0 }}
                />
              </Card>

              {/* Three Ways to Give Feedback */}
              <Card 
                title={
                  <Space>
                    <MessageOutlined />
                    Three Ways to Give Feedback
                  </Space>
                }
                style={{ 
                  marginBottom: 24,
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card 
                      size="small"
                      style={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: 'none',
                        borderRadius: 12
                      }}
                    >
                      <Space direction="vertical" size="small">
                        <BulbOutlined style={{ fontSize: 24, color: '#d97706' }} />
                        <Title level={5} style={{ color: '#92400e', margin: 0 }}>
                          Quick Feedback
                        </Title>
                        <Text style={{ color: '#78350f' }}>
                          Submit feedback quickly with our popup form and screenshot tools.
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      size="small"
                      style={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        border: 'none',
                        borderRadius: 12
                      }}
                    >
                      <Space direction="vertical" size="small">
                        <CustomerServiceOutlined style={{ fontSize: 24, color: '#059669' }} />
                        <Title level={5} style={{ color: '#047857', margin: 0 }}>
                          Chat Support
                        </Title>
                        <Text style={{ color: '#065f46' }}>
                          Get live support and submit feedback through our messenger interface.
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      size="small"
                      style={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: 'none',
                        borderRadius: 12
                      }}
                    >
                      <Space direction="vertical" size="small">
                        <FileTextOutlined style={{ fontSize: 24, color: '#2563eb' }} />
                        <Title level={5} style={{ color: '#1d4ed8', margin: 0 }}>
                          Full Portal
                        </Title>
                        <Text style={{ color: '#1e40af' }}>
                          Browse all feedback, vote on existing requests, and see our roadmap.
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* Embedded Portal */}
              <Card
                title={
                  <Space>
                    <RocketOutlined />
                    Full Feedback Portal
                  </Space>
                }
                style={{ 
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div 
                  data-featurebase-embed 
                  style={{ 
                    minHeight: 600,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid ${token.colorBorder}`
                  }}
                />
              </Card>
            </Col>

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <div style={{ position: 'sticky', top: 24 }}>
                <Card 
                  title={
                    <Space>
                      <FileTextOutlined />
                      Feedback Categories
                    </Space>
                  }
                  style={{ 
                    marginBottom: 24,
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Radio.Group
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {filterOptions.map((option) => (
                        <Radio 
                          key={option.value} 
                          value={option.value}
                          style={{ 
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1px solid ${filter === option.value ? token.colorPrimary : token.colorBorder}`,
                            background: filter === option.value 
                              ? `${token.colorPrimary}08`
                              : 'transparent'
                          }}
                        >
                          <Space>
                            {option.icon}
                            <Text strong={filter === option.value}>
                              {option.label}
                            </Text>
                            <Tag color={option.color} style={{ marginLeft: 'auto' }}>
                              {Math.floor(Math.random() * 50) + 1}
                            </Tag>
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>

                  <Divider />
                  
                  <Button
                    type="dashed"
                    size="large"
                    icon={<BulbOutlined />}
                    onClick={() => handleFeedbackWidget()}
                    disabled={!feedbackWidgetReady}
                    style={{ 
                      width: '100%',
                      height: 48,
                      borderRadius: 12,
                      borderStyle: 'dashed',
                      borderWidth: 2
                    }}
                    data-featurebase-feedback
                  >
                    Quick Feedback
                  </Button>
                </Card>

                {/* Status Card */}
                {!identity && (
                  <Alert
                    message="Authentication Required"
                    description="Please log in to submit feedback and access all features."
                    type="info"
                    showIcon
                    style={{ 
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
              </div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
    </div>
  );
}