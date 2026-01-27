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
  Avatar,
  Typography,
  Row,
  Col,
  Space,
  theme,
  Alert,
  Spin
} from 'antd';
import {
  CustomerServiceOutlined,
  BulbOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  RocketOutlined,
  MessageOutlined
} from '@ant-design/icons';

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

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
  const [feedbackWidgetReady, setFeedbackWidgetReady] = useState(false);
  const [messengerReady, setMessengerReady] = useState(false);
  const { theme: appTheme } = useTheme();
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
  const { currentWorkspace } = useWorkspaceContext();
  const router = useRouter();

  const { token } = theme.useToken();
  const isDark = appTheme === 'dark';

  // --- 1. FORCE LOAD MANROPE FONT ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
       // cleanup optional
    };
  }, []);

  // --- 2. Initialize FeatureBase (Logic Unchanged) ---
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
          theme: isDark ? 'dark' : 'light',
          email: identity?.email || '',
          name: identity?.name || '',
          locale: 'en',
        },
        (err: any, callback: any) => {
          if (callback?.action === 'widgetReady') {
            setFeedbackWidgetReady(true);
          }
        }
      );

      // Initialize Messenger Widget
      win.Featurebase("boot", {
        appId: process.env.NEXT_PUBLIC_ARBITRAGEOS_APP_ID, 
        email: identity?.email || '',
        userId: identity?.id || '',
        createdAt: new Date().toISOString(),
        theme: isDark ? 'dark' : 'light',
        language: 'en',
        userName: identity?.name || '',
        userAvatar: identity?.avatar || '',
      });

      // Initialize Embedded Portal
      win.Featurebase("init_embed_widget", {
        organization: "growai",
        embedOptions: { path: "/", filters: "" },
        stylingOptions: {
          theme: isDark ? 'dark' : 'light',
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

      setMessengerReady(true);
    };

    if (identity && !isLoading) {
      const timer = setTimeout(initializeWidgets, 500);
      return () => clearTimeout(timer);
    }
  }, [identity, isDark, isLoading]);

  // --- Handlers ---
  const handleFeedbackWidget = (boardType?: string) => {
    if (!identity) return alert('Please log in to submit feedback');
    if (!feedbackWidgetReady) return alert('Feedback widget is loading...');

    if (boardType) {
      window.postMessage({
        target: 'FeaturebaseWidget',
        data: { action: 'openFeedbackWidget', setBoard: boardType }
      });
    }
  };

  const handleMessenger = () => {
    if (!identity) return alert('Please log in to open messenger');
    if (!messengerReady) return alert('Messenger is loading...');
    try {
      (window as any).Featurebase('show');
    } catch (e) {
      alert('Failed to open messenger.');
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  // --- Styling Constants ---
  const fontFamily = "'Manrope', sans-serif";
  const bgMain = isDark ? '#050505' : '#F9FAFB';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const borderColor = isDark ? '#303030' : '#E5E7EB';
  const primaryGradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  const secondaryGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

  return (
    <div style={{ fontFamily, backgroundColor: bgMain, minHeight: '100vh' }}>
      <Head>
        <title>Feedback Hub | ArbitrageOS</title>
      </Head>

      <Script 
        src="https://do.featurebase.app/js/sdk.js" 
        id="featurebase-sdk"
        strategy="afterInteractive"
      />

      {/* Header Bar */}
      <div style={{ 
        padding: '20px 40px', 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: `1px solid ${borderColor}`,
        backgroundColor: isDark ? 'rgba(20,20,20,0.8)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Button 
          type="text"
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ 
            fontFamily, 
            fontSize: '14px', 
            fontWeight: 600,
            color: isDark ? '#9CA3AF' : '#4B5563',
            padding: 0
          }}
        >
          Back to Dashboard
        </Button>
      </div>

      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: '40px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            
            {/* 1. Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 16px', 
                borderRadius: '20px', 
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                marginBottom: 24,
                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'}`
              }}>
                <MessageOutlined style={{ color: '#6366f1' }} />
                <Text style={{ color: '#6366f1', fontWeight: 600, fontFamily }}>Feedback Hub</Text>
              </div>
              
              <Title level={1} style={{ 
                marginBottom: 16, 
                fontSize: '3rem', 
                fontWeight: 800, 
                fontFamily,
                letterSpacing: '-0.02em',
                color: isDark ? '#fff' : '#111827'
              }}>
                Help shape the future.
              </Title>
              <Paragraph style={{ 
                fontSize: '1.25rem', 
                color: isDark ? '#9CA3AF' : '#6B7280', 
                maxWidth: 600, 
                margin: '0 auto', 
                fontFamily,
                lineHeight: 1.6
              }}>
                We build ArbitrageOS for you. Share your ideas, report bugs, or just say hello directly to the team.
              </Paragraph>
            </div>

            {/* 2. User Welcome Card */}
            {identity && (
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 backgroundColor: cardBg,
                 border: `1px solid ${borderColor}`,
                 borderRadius: '20px',
                 padding: '24px',
                 marginBottom: 32,
                 boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.02)'
               }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {identity.avatar ? (
                      <Avatar size={56} src={identity.avatar} style={{ border: `2px solid ${borderColor}` }} />
                    ) : (
                      <Avatar size={56} style={{ background: primaryGradient }} icon={<UserOutlined />} />
                    )}
                    <div>
                      <Title level={4} style={{ margin: 0, fontFamily, fontWeight: 700 }}>
                        Welcome back, {identity.name?.split(' ')[0]}
                      </Title>
                      <Text style={{ fontFamily, color: isDark ? '#6B7280' : '#9CA3AF' }}>
                        {identity.email}
                      </Text>
                    </div>
                 </div>
                 {!feedbackWidgetReady && <Spin />}
               </div>
            )}

            {!identity && (
              <Alert
                message="Authentication Required"
                description="Please log in to your account to submit feedback."
                type="warning"
                showIcon
                style={{ marginBottom: 32, borderRadius: 12 }}
              />
            )}

            {/* 3. Action Grid */}
            <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
              <Col xs={24} md={12}>
                <button
                  onClick={() => handleFeedbackWidget()}
                  disabled={!identity || !feedbackWidgetReady}
                  style={{
                    width: '100%',
                    padding: '32px',
                    borderRadius: '24px',
                    border: 'none',
                    background: primaryGradient,
                    cursor: (!identity || !feedbackWidgetReady) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    height: '180px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: 12, 
                    borderRadius: '12px',
                    marginBottom: 16
                  }}>
                     {!feedbackWidgetReady ? <LoadingOutlined style={{ fontSize: 24, color: '#fff' }} /> : <BulbOutlined style={{ fontSize: 24, color: '#fff' }} />}
                  </div>
                  <div style={{ textAlign: 'left', zIndex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily }}>
                      Submit Feedback
                    </Text>
                    <Text style={{ display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontFamily, marginTop: 4 }}>
                      Request features or report issues directly.
                    </Text>
                  </div>
                  {/* Decorative Circle */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                  }} />
                </button>
              </Col>

              <Col xs={24} md={12}>
                <button
                  onClick={handleMessenger}
                  disabled={!identity || !messengerReady}
                  style={{
                    width: '100%',
                    padding: '32px',
                    borderRadius: '24px',
                    border: 'none',
                    background: secondaryGradient,
                    cursor: (!identity || !messengerReady) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    height: '180px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: 12, 
                    borderRadius: '12px',
                    marginBottom: 16
                  }}>
                     {!messengerReady ? <LoadingOutlined style={{ fontSize: 24, color: '#fff' }} /> : <CustomerServiceOutlined style={{ fontSize: 24, color: '#fff' }} />}
                  </div>
                  <div style={{ textAlign: 'left', zIndex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily }}>
                      Live Support
                    </Text>
                    <Text style={{ display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontFamily, marginTop: 4 }}>
                      Chat with our team for immediate help.
                    </Text>
                  </div>
                  {/* Decorative Circle */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                  }} />
                </button>
              </Col>
            </Row>

            {/* 4. Full Portal Embed */}
            <Card
              bordered={false}
              style={{
                borderRadius: '24px',
                background: cardBg,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 40px rgba(0,0,0,0.04)',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{ 
                padding: '24px 32px', 
                borderBottom: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <RocketOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0, fontFamily, fontWeight: 700 }}>
                  Community Roadmap
                </Title>
              </div>
              <div 
                data-featurebase-embed 
                style={{ 
                  minHeight: 700,
                  width: '100%'
                }}
              />
            </Card>

          </div>
        </Content>
      </Layout>
    </div>
  );
}