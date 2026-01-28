// components/CreditsDisplayHeader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Statistic,
  Progress,
  Alert,
  message,
  Row,
  Col,
  ConfigProvider,
  theme as antTheme,
  Divider,
  Tooltip
} from 'antd';
import {
  CreditCardOutlined,
  GiftOutlined,
  InfoCircleOutlined,
  ThunderboltFilled,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons';
import CreditsPurchaseModal from './CreditsDisplayModal';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_CARD = '#09090b';
const BORDER_COLOR = '#27272a';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_PRIMARY = '#ffffff';

interface CreditsDisplayHeaderProps {
  onCreditsUpdate?: (newCredits: number) => void;
}

interface UserCredits {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

const CreditsDisplayHeader: React.FC<CreditsDisplayHeaderProps> = ({
  onCreditsUpdate
}) => {
  const [credits, setCredits] = useState<UserCredits>({
    credits: 0,
    freeLeadsUsed: 0,
    freeLeadsAvailable: 0,
    totalPurchased: 0
  });
  const [loading, setLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const router = useRouter();

  // --- FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      
      if (data.success) {
        setCredits(data.data);
        onCreditsUpdate?.(data.data.credits);
      } else {
        message.error('Failed to load credits');
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
      message.error('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setCredits(prev => ({
      ...prev,
      credits: newBalance
    }));
    onCreditsUpdate?.(newBalance);
    loadCredits(); 
  };

  const isLowCredits = credits.credits < 100;
  const isCriticalCredits = credits.credits < 10;

  // Render Alert Content Helper
  const renderAlertContent = () => {
    if (credits.freeLeadsAvailable === 0 && isCriticalCredits) {
      return {
        type: 'error' as const,
        message: 'Credits Critical',
        description: `You are out of free leads and running low on credits (${credits.credits}). Top up to continue generating leads.`
      };
    }
    if (credits.freeLeadsAvailable === 0 && isLowCredits && !isCriticalCredits) {
      return {
        type: 'warning' as const,
        message: 'Low Balance',
        description: `Free leads exhausted. You have ${credits.credits} credits remaining.`
      };
    }
    if (credits.freeLeadsAvailable > 0 && credits.credits === 0) {
      return {
        type: 'info' as const,
        message: 'Welcome!',
        description: `You have ${credits.freeLeadsAvailable} free leads available to get started.`
      };
    }
    return null;
  };

  const activeAlert = renderAlertContent();

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: SURFACE_CARD,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          colorTextSecondary: TEXT_SECONDARY,
          borderRadius: 8,
        },
        components: {
          Button: { fontWeight: 600, defaultBg: 'transparent', defaultBorderColor: BORDER_COLOR },
          Card: { headerBg: 'transparent', colorBgContainer: SURFACE_CARD },
          Statistic: { titleFontSize: 12, contentFontSize: 28 },
          Progress: { defaultColor: BRAND_GREEN, remainingColor: '#27272a' },
          Alert: { 
            colorErrorBg: 'rgba(239, 68, 68, 0.1)', 
            colorErrorBorder: 'rgba(239, 68, 68, 0.2)',
            colorWarningBg: 'rgba(234, 179, 8, 0.1)',
            colorWarningBorder: 'rgba(234, 179, 8, 0.2)',
            colorInfoBg: 'rgba(59, 130, 246, 0.1)',
            colorInfoBorder: 'rgba(59, 130, 246, 0.2)',
          }
        }
      }}
    >
      <div style={{ fontFamily: 'Manrope, sans-serif', marginBottom: '24px' }}>
        <Card 
          bordered={false} 
          style={{ 
            border: `1px solid ${BORDER_COLOR}`, 
            backgroundColor: DARK_BG,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
          }}
          bodyStyle={{ padding: '20px 24px' }}
        >
          <Row gutter={[24, 24]} align="middle">
            
            {/* 1. Main Credits Display */}
            <Col xs={24} sm={8} md={6}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Available Balance
                </Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <ThunderboltFilled style={{ fontSize: '24px', color: BRAND_GREEN }} />
                  <Statistic
                    value={credits.credits}
                    loading={loading}
                    valueStyle={{ 
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '36px',
                      lineHeight: 1,
                      fontFamily: 'Manrope'
                    }}
                    formatter={(value) => (
                      <span style={{ 
                        background: isCriticalCredits 
                          ? 'linear-gradient(90deg, #ff4d4f, #ff7875)' 
                          : `linear-gradient(90deg, #fff, ${TEXT_SECONDARY})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {value}
                      </span>
                    )}
                  />
                </div>
                {credits.totalPurchased > 0 && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: TEXT_SECONDARY }}>
                    Lifetime purchased: <span style={{ color: '#fff' }}>{credits.totalPurchased.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Col>

            {/* Divider for Desktop */}
            <Col xs={0} sm={1} style={{ textAlign: 'center' }}>
              <Divider type="vertical" style={{ height: '60px', borderColor: BORDER_COLOR }} />
            </Col>

            {/* 2. Free Leads Display */}
            <Col xs={24} sm={7} md={6}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <Text style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    <GiftOutlined style={{ color: BRAND_GREEN, marginRight: '6px' }} />
                    Free Leads
                  </Text>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: '12px' }}>
                    {credits.freeLeadsAvailable} / 5 left
                  </Text>
                </div>
                
                <Progress
                  percent={((credits.freeLeadsAvailable) / 5) * 100}
                  size="small"
                  showInfo={false}
                  strokeColor={{
                    '0%': BRAND_GREEN,
                    '100%': '#34D399',
                  }}
                  trailColor="rgba(255,255,255,0.1)"
                  strokeWidth={6}
                />
               
              </div>
            </Col>

            {/* 3. Cost Info */}
            <Col xs={24} sm={8} md={5}>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px', 
                padding: '10px 16px',
                border: `1px solid ${BORDER_COLOR}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <InfoCircleOutlined style={{ color: '#3b82f6', marginRight: '6px', fontSize: '14px' }} />
                  <Text style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Rate Card</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: TEXT_SECONDARY, marginTop: '2px' }}>
                  <span>1 Lead</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>1 Credit</span>
                </div>
              </div>
            </Col>

            {/* 4. Action Buttons */}
            <Col xs={24} sm={24} md={6}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined style={{ color: '#000' }} />}
                  onClick={() => setPurchaseModalVisible(true)}
                  style={{ 
                    backgroundColor: BRAND_GREEN, 
                    borderColor: BRAND_GREEN, 
                    color: '#000', 
                    width: '100%',
                    boxShadow: `0 0 15px ${BRAND_GREEN}40`,
                    height: '42px',
                    fontWeight: 700
                  }}
                >
                  Buy Credits
                </Button>
                
                <Button
                  type="text"
                  size="small"
                  onClick={() => router.push('/credits')}
                  style={{ color: TEXT_SECONDARY, fontSize: '12px', display: 'flex', alignItems: 'center' }}
                >
                  <CreditCardOutlined style={{ marginRight: '4px' }} /> Transaction History <RightOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
                </Button>
              </div>
            </Col>
          </Row>

          {/* Conditional Alert Section */}
          {activeAlert && (
            <div style={{ marginTop: '20px', animation: 'fadeIn 0.5s ease' }}>
              <Alert
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{activeAlert.message}</span>
                    {activeAlert.type !== 'info' && (
                        <Button 
                            type="link" 
                            size="small" 
                            onClick={() => setPurchaseModalVisible(true)}
                            style={{ padding: 0, height: 'auto', fontSize: '12px', fontWeight: 600 }}
                        >
                            Refill Now
                        </Button>
                    )}
                  </div>
                }
                description={<span style={{ fontSize: '12px', opacity: 0.9 }}>{activeAlert.description}</span>}
                type={activeAlert.type}
                showIcon
                style={{ 
                    borderRadius: '8px', 
                    border: `1px solid ${activeAlert.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : activeAlert.type === 'warning' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                    backgroundColor: activeAlert.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : activeAlert.type === 'warning' ? 'rgba(234, 179, 8, 0.05)' : 'rgba(59, 130, 246, 0.05)'
                }}
              />
            </div>
          )}
        </Card>

        <CreditsPurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
          onPurchaseComplete={handlePurchaseComplete}
          currentCredits={credits.credits}
        />
        
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default CreditsDisplayHeader;