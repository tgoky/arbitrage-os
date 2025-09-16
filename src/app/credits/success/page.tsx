// app/credits/success/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Spin, Alert, Result } from 'antd';
import { CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
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
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: 24,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card>
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-4">Verifying your payment...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        padding: 24,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card>
          <Alert
            message="Payment Verification Failed"
            description={error}
            type="error"
            showIcon
            action={
              <Button onClick={() => router.push('/lead-generation')}>
                Continue to Dashboard
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
      padding: 24,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card style={{ maxWidth: 600, width: '100%' }}>
        <Result
          status="success"
          title="Payment Successful!"
          subTitle={
            purchaseDetails ? (
              <div className="space-y-2">
                <div>Successfully purchased <strong>{purchaseDetails.packageName}</strong></div>
                <div><strong>{purchaseDetails.credits}</strong> credits added to your account</div>
                <div>New balance: <strong>{purchaseDetails.newBalance}</strong> credits</div>
                <div className="text-sm text-gray-500">
                  Amount paid: ${purchaseDetails.amountPaid} on {purchaseDetails.purchaseDate}
                </div>
              </div>
            ) : (
              'Your credits have been added to your account.'
            )
          }
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          extra={[
            <Button 
              type="primary" 
              key="dashboard" 
              icon={<ThunderboltOutlined />}
              onClick={() => router.push('/lead-generation')}
              size="large"
            >
              Start Generating Leads
            </Button>,
            <Button 
              key="credits" 
              onClick={() => router.push('/credits')}
            >
              View Credit History
            </Button>,
          ]}
        />
        
        <div className="text-center mt-6">
          <Text type="secondary">
            Session ID: {sessionId}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SuccessPage;