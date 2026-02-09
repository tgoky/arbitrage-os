// components/CreditsDisplayHeader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Statistic,
  Progress,
  ConfigProvider,
  theme as antTheme,
  Tooltip,
  Space,
  Badge
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  HistoryOutlined,
  GiftOutlined
} from '@ant-design/icons';
import CreditsPurchaseModal from './CreditsDisplayModal';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

// --- STYLING CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000'; // Pure Black
const BORDER_COLOR = 'rgba(255, 255, 255, 0.1)';
const TEXT_SECONDARY = '#71717a'; // Darker grey for minimal distraction
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

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap';
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
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setCredits(prev => ({ ...prev, credits: newBalance }));
    onCreditsUpdate?.(newBalance);
    loadCredits(); 
  };

  const isLowCredits = credits.credits < 50;
  const freeLeadsPercent = (credits.freeLeadsAvailable / 5) * 100;

  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: {
          colorPrimary: BRAND_GREEN,
          fontFamily: 'Manrope, sans-serif',
          colorBgContainer: DARK_BG,
          colorBorder: BORDER_COLOR,
          colorText: TEXT_PRIMARY,
          borderRadius: 6,
        },
        components: {
          Button: { 
            fontWeight: 600, 
            controlHeight: 32,
            defaultBorderColor: BORDER_COLOR,
            defaultBg: 'rgba(255,255,255,0.05)'
          },
          Progress: {
             defaultColor: BRAND_GREEN,
             remainingColor: 'rgba(255,255,255,0.1)'
          }
        }
      }}
    >
      <div style={{ marginBottom: '20px', fontFamily: 'Manrope, sans-serif' }}>
        <Card 
          bordered={false} 
          style={{ 
            backgroundColor: DARK_BG,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: '8px',
          }}
          bodyStyle={{ padding: '16px 24px' }} // Reduced padding for compactness
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            
            {/* SECTION 1: CREDITS & TOP UP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '2px' }}>
                  Available Credits
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Space size={8}>
                     <WalletOutlined style={{ color: isLowCredits ? '#faad14' : BRAND_GREEN, fontSize: '18px' }} />
                     <Statistic
                        value={credits.credits}
                        loading={loading}
                        valueStyle={{ 
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '24px', // Smaller font size
                          lineHeight: 1
                        }}
                      />
                  </Space>
                  
                  {isLowCredits && <Badge status="warning" />}
                </div>
              </div>

              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined style={{ color: '#000', fontSize: '12px' }} />}
                onClick={() => setPurchaseModalVisible(true)}
                style={{ 
                  backgroundColor: BRAND_GREEN, 
                  borderColor: BRAND_GREEN,
                  color: '#000',
                  fontSize: '12px',
                  boxShadow: 'none'
                }}
              >
                Top Up
              </Button>
            </div>

            {/* SECTION 2: FREE LEADS (Compact) */}
            <div style={{ flex: 1, maxWidth: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                <Space size={6}>
                  <GiftOutlined style={{ fontSize: '12px', color: TEXT_SECONDARY }} />
                  <Text style={{ color: '#e4e4e7', fontWeight: 500, fontSize: '12px' }}>Monthly Free Tier</Text>
                </Space>
                <Text style={{ color: TEXT_SECONDARY, fontSize: '11px' }}>
                  <span style={{ color: '#fff' }}>{credits.freeLeadsAvailable}</span>/5
                </Text>
              </div>
              <Progress 
                percent={freeLeadsPercent} 
                showInfo={false} 
                strokeWidth={4} // Thinner bar
                size="small"
                strokeColor={BRAND_GREEN}
              />
            </div>

            {/* SECTION 3: HISTORY */}
            <div style={{ paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
               <Tooltip title="Transaction History">
                <Button 
                  type="text" 
                  shape="circle"
                  icon={<HistoryOutlined style={{ fontSize: '16px', color: TEXT_SECONDARY }} />}
                  onClick={() => router.push('/credits')}
                  className="hover-white"
                />
                Credit History
               </Tooltip> 
            </div>

          </div>
        </Card>

        <CreditsPurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
          onPurchaseComplete={handlePurchaseComplete}
          currentCredits={credits.credits}
        />

        <style jsx global>{`
          .hover-white:hover {
            color: #fff !important;
            background: rgba(255,255,255,0.1) !important;
          }
          /* Hide Free Tier on very small mobile screens to prevent breaking */
          @media (max-width: 576px) {
            .ant-card-body { padding: 16px !important; }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default CreditsDisplayHeader;