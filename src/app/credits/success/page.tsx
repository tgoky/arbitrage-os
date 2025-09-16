// app/credits/success/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Spin, Alert, Result, Divider } from 'antd';
import { CheckCircleOutlined, ThunderboltOutlined, ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';

const { Title, Text } = Typography;

const SuccessPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/credits/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified:', data.data);
      
      setPurchaseDetails({
        verified: true,
        sessionId,
        packageName: data.data.purchase.packageName,
        credits: data.data.purchase.credits,
        newBalance: data.data.userCredits.currentBalance,
        amountPaid: data.data.session.amountTotal / 100, // Convert from cents
        purchaseDate: new Date(data.data.purchase.timestamp).toLocaleDateString()
      });
      
      setLoading(false);
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify payment');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme === 'dark' ? '#0f1116' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <Card 
          style={{ 
            maxWidth: '500px', 
            width: '100%',
            boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: '12px',
            background: theme === 'dark' ? '#1a1f2e' : '#ffffff'
          }}
        >
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Spin size="large" style={{ color: theme === 'dark' ? '#3b82f6' : '#2563eb' }} />
            <Title level={4} style={{ marginTop: '24px', color: theme === 'dark' ? '#e2e8f0' : '#334155' }}>
              Verifying your payment...
            </Title>
            <Text style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
              This will only take a moment
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme === 'dark' ? '#0f1116' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <Card 
          style={{ 
            maxWidth: '600px', 
            width: '100%',
            boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: '12px',
            background: theme === 'dark' ? '#1a1f2e' : '#ffffff'
          }}
        >
          <Alert
            message="Payment Verification Failed"
            description={
              <div>
                <p>{error}</p>
                <p style={{ marginTop: '8px' }}>Please contact support if you believe this is an error.</p>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button 
              type="primary" 
              onClick={() => router.push('/credits')}
              icon={<ArrowLeftOutlined />}
            >
              Back to Credits
            </Button>
            <Button 
              onClick={() => router.push('/lead-generation')}
            >
              Continue to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme === 'dark' ? '#0f1116' : '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <Card 
        style={{ 
          maxWidth: '680px', 
          width: '100%',
          boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none',
          borderRadius: '16px',
          overflow: 'hidden',
          background: theme === 'dark' ? '#1a1f2e' : '#ffffff'
        }}
      >
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(72, 187, 120, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircleOutlined style={{ fontSize: '40px', color: '#48bb78' }} />
          </div>
          
          <Title level={2} style={{ 
            marginBottom: '8px', 
            color: theme === 'dark' ? '#f7fafc' : '#1a202c',
            fontWeight: 700
          }}>
            Payment Successful!
          </Title>
          
          <Text style={{ 
            fontSize: '16px', 
            color: theme === 'dark' ? '#cbd5e0' : '#4a5568',
            marginBottom: '32px',
            display: 'block'
          }}>
            Thank you for your purchase. Your credits have been added to your account.
          </Text>
          
          <Divider style={{ 
            margin: '24px 0',
            borderColor: theme === 'dark' ? '#2d3748' : '#e2e8f0'
          }} />
          
          {purchaseDetails && (
            <div style={{ 
              background: theme === 'dark' ? '#232a3b' : '#f1f5f9',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <Title level={4} style={{ 
                marginBottom: '20px', 
                color: theme === 'dark' ? '#e2e8f0' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CreditCardOutlined />
                Purchase Details
              </Title>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Text strong style={{ color: theme === 'dark' ? '#cbd5e0' : '#475569' }}>Package:</Text>
                  <div style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', marginTop: '4px' }}>
                    {purchaseDetails.packageName}
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ color: theme === 'dark' ? '#cbd5e0' : '#475569' }}>Credits Added:</Text>
                  <div style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', marginTop: '4px' }}>
                    {purchaseDetails.credits.toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ color: theme === 'dark' ? '#cbd5e0' : '#475569' }}>New Balance:</Text>
                  <div style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', marginTop: '4px' }}>
                    {purchaseDetails.newBalance.toLocaleString()} credits
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ color: theme === 'dark' ? '#cbd5e0' : '#475569' }}>Amount Paid:</Text>
                  <div style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', marginTop: '4px' }}>
                    ${purchaseDetails.amountPaid.toFixed(2)}
                  </div>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <Text strong style={{ color: theme === 'dark' ? '#cbd5e0' : '#475569' }}>Purchase Date:</Text>
                  <div style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', marginTop: '4px' }}>
                    {purchaseDetails.purchaseDate}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Space direction="vertical" style={{ width: '100%', gap: '16px' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={() => router.push('/lead-generation')}
              style={{
                height: '48px',
                width: '100%',
                fontSize: '16px',
                fontWeight: 600,
                background: '#2B2B28',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              Start Generating Leads
            </Button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                size="large"
                onClick={() => router.push('/credits')}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: '8px'
                }}
              >
                View Credit History
              </Button>
              
              <Button 
                size="large"
                onClick={() => router.push('/')}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: '8px'
                }}
              >
                Return to Home
              </Button>
            </div>
          </Space>
          
          <div style={{ 
            marginTop: '32px', 
            padding: '12px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: '8px'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Session ID: {sessionId}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuccessPage;