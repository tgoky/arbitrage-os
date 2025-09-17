// app/credits/success/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { CheckCircle, ArrowLeft, CreditCard, Zap, Home, Clock } from 'lucide-react';

const SuccessPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
        {/* Desktop Background */}
        <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
          {/* Loading Window */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
              <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-white flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-gray-600 animate-spin"></div>
                  </div>
                  <span className="font-bold">Processing Payment</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">_</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">□</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">×</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-200">
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-blue-700 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-lg font-bold text-gray-800 mb-2">Verifying your payment...</div>
                  <div className="text-sm text-gray-600">This will only take a moment</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Taskbar */}
        <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
          <button className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600">
            <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-600"></div>
            </div>
            Start
          </button>

          <div className="flex-1 flex space-x-1 mx-2">
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-gray-600 animate-spin"></div>
              </div>
              Processing Payment
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-xs">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
        {/* Desktop Background */}
        <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
          {/* Error Window */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
              <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-white flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-gray-600 bg-red-600"></div>
                  </div>
                  <span className="font-bold">Payment Error</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">_</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">□</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">×</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-200">
                <div className="border-2 border-gray-400 bg-white p-4">
                  <div className="flex items-start mb-4">
                    <div className="w-6 h-6 bg-red-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <div className="font-bold text-red-800 mb-1">Payment Verification Failed</div>
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-4">
                    Please contact support if you believe this is an error.
                  </div>
                  <div className="flex justify-between">
                    <button 
                      className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 flex items-center"
                      onClick={() => router.push('/credits')}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Credits
                    </button>
                    <button 
                      className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400"
                      onClick={() => router.push('/lead-generation')}
                    >
                      Continue to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Taskbar */}
        <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
          <button className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600">
            <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-600"></div>
            </div>
            Start
          </button>

          <div className="flex-1 flex space-x-1 mx-2">
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-gray-600 bg-red-600"></div>
              </div>
              Payment Error
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-xs">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
      {/* Desktop Background */}
      <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
        {/* Success Window */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 bg-white flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-gray-600 bg-green-600"></div>
                </div>
                <span className="font-bold">Payment Successful</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">_</span>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">□</span>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200">
              <div className="border-2 border-gray-400 bg-white p-4">
                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 border-2 border-green-400 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                
                {/* Title */}
                <div className="text-center mb-4">
                  <div className="text-xl font-bold text-gray-800 mb-1">Payment Successful!</div>
                  <div className="text-sm text-gray-600">
                    Thank you for your purchase. Your credits have been added to your account.
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t-2 border-gray-300 my-4"></div>
                
                {/* Purchase Details */}
                {purchaseDetails && (
                  <div className="bg-gray-100 border-2 border-gray-300 p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <CreditCard className="w-4 h-4 mr-2 text-blue-800" />
                      <div className="font-bold text-gray-800">Purchase Details</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-600">Package:</div>
                        <div className="font-medium">{purchaseDetails.packageName}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600">Credits Added:</div>
                        <div className="font-medium">{purchaseDetails.credits.toLocaleString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600">New Balance:</div>
                        <div className="font-medium">{purchaseDetails.newBalance.toLocaleString()} credits</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600">Amount Paid:</div>
                        <div className="font-medium">${purchaseDetails.amountPaid.toFixed(2)}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="text-xs text-gray-600">Purchase Date:</div>
                        <div className="font-medium">{purchaseDetails.purchaseDate}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Buttons */}
                <div className="space-y-2">
                  <button 
                    className="w-full py-2 bg-blue-700 text-white font-bold border-2 border-blue-900 hover:bg-blue-800 flex items-center justify-center"
                    onClick={() => router.push('/lead-generation')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Generating Leads
                  </button>
                  
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400"
                      onClick={() => router.push('/credits')}
                    >
                      View Credit History
                    </button>
                    
                    <button 
                      className="flex-1 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 flex items-center justify-center"
                      onClick={() => router.push('/')}
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </button>
                  </div>
                </div>
                
                {/* Session ID */}
                <div className="mt-4 p-2 bg-gray-200 border border-gray-300 text-xs text-center">
                  <div className="text-gray-600">Session ID: {sessionId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
        <button className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600">
          <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-gray-600"></div>
          </div>
          Start
        </button>

        <div className="flex-1 flex space-x-1 mx-2">
          <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
            <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-600 bg-green-600"></div>
            </div>
            Payment Successful
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;