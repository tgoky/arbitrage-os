// app/credits/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import CreditsPurchaseModal from '../../../components/credits/CreditsDisplayModal';
import { 
  CreditCard, 
  Zap, 
  Gift, 
  History, 
  Download, 
  ShoppingCart, 
  Info, 
  Plus, 
  ArrowLeft,
  Clock,
  HardDrive,
  File,
  Trash2
} from 'lucide-react';
import dayjs from 'dayjs';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  reference_id?: string;
  metadata?: any;
  workspace?: {
    name: string;
    slug: string;
  };
}

interface UserCredits {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

interface UsageStats {
  creditsUsed: number;
  freeLeadsUsed: number;
  generationsCount: number;
  totalLeadsGenerated: number;
  timeframe: string;
}

const CreditsHistoryPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits>({
    credits: 0,
    freeLeadsUsed: 0,
    freeLeadsAvailable: 0,
    totalPurchased: 0
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    creditsUsed: 0,
    freeLeadsUsed: 0,
    generationsCount: 0,
    totalLeadsGenerated: 0,
    timeframe: 'month'
  });
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeWindow, setActiveWindow] = useState<string>('credits');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user credits
      const creditsResponse = await fetch('/api/user/credits');
      const creditsData = await creditsResponse.json();
      
      if (creditsData.success) {
        setUserCredits(creditsData.data);
      }

      // Load transaction history
      const historyResponse = await fetch(`/api/user/credits/history?timeframe=${timeframe}`);
      const historyData = await historyResponse.json();
      
      if (historyData.success) {
        setTransactions(historyData.data.transactions || []);
        setUsageStats(historyData.data.stats || usageStats);
      }
      
    } catch (error) {
      console.error('Failed to load credits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setUserCredits(prev => ({ ...prev, credits: newBalance }));
    loadData(); // Refresh all data
  };

  const handleExportHistory = () => {
    if (transactions.length === 0) return;
    
    const csvHeaders = ['Date', 'Type', 'Amount', 'Description', 'Reference ID'];
    const csvRows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.transaction_type,
      tx.amount.toString(),
      tx.description,
      tx.reference_id || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `credits_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#00c000'; // Green
      case 'usage': return '#0000c0'; // Blue
      case 'free_usage': return '#c06000'; // Orange
      case 'refund': return '#8000c0'; // Purple
      case 'bonus': return '#c0c000'; // Gold
      default: return '#808080'; // Gray
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <CreditCard className="w-3 h-3" />;
      case 'usage': return <Zap className="w-3 h-3" />;
      case 'free_usage': return <Gift className="w-3 h-3" />;
      default: return <History className="w-3 h-3" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredTransactions = transactions.filter(tx => 
    transactionType === 'all' || tx.transaction_type === transactionType
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
      {/* Desktop Background */}
      <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
        {/* Desktop Icons */}
        <div className="absolute left-0 top-0 p-6 space-y-8 flex flex-col">
          {/* My Computer Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("my-computer")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <rect x="8" y="12" width="40" height="30" rx="2" fill="#1084D0" />
                <rect x="12" y="16" width="32" height="22" fill="#000" />
                <path d="M12 16 L44 16 L36 24 Z" fill="white" fillOpacity="0.2" />
                <rect x="24" y="42" width="8" height="4" fill="#595959" />
                <rect x="20" y="46" width="16" height="4" fill="#808080" />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Computer
            </span>
          </div>

          {/* My Documents Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("documents")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <path
                  d="M10 16H46V46H10V16Z"
                  fill="#FFCC00"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 16L20 8H36L46 16"
                  fill="#FFCC00"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <rect x="16" y="24" width="24" height="2" fill="#000" />
                <rect x="16" y="28" width="20" height="2" fill="#000" />
                <rect x="16" y="32" width="24" height="2" fill="#000" />
                <rect x="16" y="36" width="18" height="2" fill="#000" />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Documents
            </span>
          </div>

          {/* Recycle Bin Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("recycle-bin")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <path
                  d="M14 20H42V44H14V20Z"
                  fill="#C0C0C0"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M18 16H38V20H18V16Z"
                  fill="#808080"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <rect x="26" y="12" width="4" height="4" fill="#000" />
                <rect x="20" y="24" width="16" height="12" fill="#FFFFFF" stroke="#000" />
                <rect x="24" y="28" width="8" height="1" fill="#000" />
                <rect x="24" y="32" width="8" height="1" fill="#000" />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              Recycle Bin
            </span>
          </div>
        </div>

        {/* Credits Window */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-6xl shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 bg-white flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-gray-600 bg-blue-600"></div>
                </div>
                <span className="font-bold">Credits & History</span>
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
              {/* Header */}
              <div className="mb-4 flex justify-between items-center">
                <button 
                  className="px-3 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 flex items-center"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </button>
                
                <button
                  className="px-3 py-1 bg-blue-700 text-white border-2 border-blue-900 font-bold hover:bg-blue-800 flex items-center"
                  onClick={() => setPurchaseModalVisible(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Buy Credits
                </button>
              </div>

              {/* Title */}
              <div className="flex items-center mb-4">
                <CreditCard className="w-6 h-6 mr-2 text-blue-800" />
                <h2 className="text-xl font-bold text-gray-800">Credits & History</h2>
              </div>
              
              <div className="text-sm text-gray-600 mb-6">
                View your credit balance, purchase history, and usage statistics
              </div>

              {/* Current Balance Cards */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {/* Available Credits */}
                <div className="border-2 border-gray-400 bg-white p-3">
                  <div className="flex items-center mb-2">
                    <Zap className="w-4 h-4 mr-1 text-green-600" />
                    <div className="font-bold text-sm">Available Credits</div>
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-1">{userCredits.credits}</div>
                  <div className="h-2 bg-gray-300 border border-gray-400">
                    <div 
                      className="h-full bg-green-600" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                {/* Free Leads */}
                <div className="border-2 border-gray-400 bg-white p-3">
                  <div className="flex items-center mb-2">
                    <Gift className="w-4 h-4 mr-1 text-blue-600" />
                    <div className="font-bold text-sm">Free Leads Remaining</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">
                    {userCredits.freeLeadsAvailable}<span className="text-sm font-normal">/5</span>
                  </div>
                  <div className="h-2 bg-gray-300 border border-gray-400">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${(userCredits.freeLeadsAvailable / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Total Purchased */}
                <div className="border-2 border-gray-400 bg-white p-3">
                  <div className="flex items-center mb-2">
                    <CreditCard className="w-4 h-4 mr-1 text-purple-600" />
                    <div className="font-bold text-sm">Total Purchased</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{userCredits.totalPurchased}</div>
                </div>

                {/* Leads Generated */}
                <div className="border-2 border-gray-400 bg-white p-3">
                  <div className="flex items-center mb-2">
                    <History className="w-4 h-4 mr-1 text-pink-600" />
                    <div className="font-bold text-sm">Leads Generated</div>
                  </div>
                  <div className="text-2xl font-bold text-pink-700">{usageStats.totalLeadsGenerated}</div>
                  <div className="text-xs text-gray-600">This {timeframe}</div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="border-2 border-gray-400 bg-white p-4 mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-4 h-4 bg-blue-700 mr-2 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white"></div>
                  </div>
                  <div className="font-bold text-gray-800">Usage Statistics</div>
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="text-sm font-bold mr-2">Time Period:</div>
                  <select 
                    className="border-2 border-gray-400 px-2 py-1 bg-white"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-700">{usageStats.creditsUsed}</div>
                    <div className="text-xs text-gray-600">Credits Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700">{usageStats.freeLeadsUsed}</div>
                    <div className="text-xs text-gray-600">Free Leads Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-700">{usageStats.generationsCount}</div>
                    <div className="text-xs text-gray-600">Generations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-700">{usageStats.totalLeadsGenerated}</div>
                    <div className="text-xs text-gray-600">Total Leads</div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="border-2 border-gray-400 bg-white p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <History className="w-4 h-4 mr-2 text-blue-800" />
                    <div className="font-bold text-gray-800">Transaction History</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      className="border-2 border-gray-400 px-2 py-1 bg-white"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="purchase">Purchases</option>
                      <option value="usage">Usage</option>
                      <option value="free_usage">Free Usage</option>
                    </select>
                    
                    <button
                      className="px-3 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 flex items-center disabled:opacity-50"
                      onClick={handleExportHistory}
                      disabled={filteredTransactions.length === 0}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-700 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-sm text-gray-600">Loading transactions...</div>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className="border-2 border-gray-300">
                    <div className="bg-gray-200 border-b-2 border-gray-300 grid grid-cols-5 p-2 font-bold text-sm">
                      <div>Date</div>
                      <div>Type</div>
                      <div className="text-right">Amount</div>
                      <div>Description</div>
                      <div>Reference</div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {filteredTransactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-5 p-2 border-b border-gray-300 text-sm hover:bg-gray-100">
                          <div>
                            <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-600">
                              {new Date(tx.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 mr-1 flex items-center justify-center"
                              style={{ color: getTransactionTypeColor(tx.transaction_type) }}
                            >
                              {getTransactionIcon(tx.transaction_type)}
                            </div>
                            <div>{tx.transaction_type.replace('_', ' ').toUpperCase()}</div>
                          </div>
                          
                          <div className="text-right">
                            <div 
                              className="font-bold" 
                              style={{ 
                                color: tx.amount > 0 ? '#00c000' : tx.amount < 0 ? '#c00000' : '#666' 
                              }}
                            >
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </div>
                            {tx.transaction_type === 'free_usage' && (
                              <div className="text-xs text-gray-600">(Free)</div>
                            )}
                          </div>
                          
                          <div>
                            <div>{tx.description}</div>
                            {tx.workspace && (
                              <div className="text-xs text-gray-600">
                                Workspace: {tx.workspace.name}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs">
                            {tx.reference_id ? (
                              <code>{tx.reference_id.substring(0, 12)}...</code>
                            ) : (
                              '-'
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-gray-300 border-dashed">
                    <div className="text-gray-600 mb-4">No transactions found</div>
                    <button 
                      className="px-3 py-1 bg-blue-700 text-white border-2 border-blue-900 font-bold hover:bg-blue-800 flex items-center mx-auto"
                      onClick={() => setPurchaseModalVisible(true)}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Make Your First Purchase
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Windows (My Computer, Documents, Recycle Bin) */}
        {activeWindow === "my-computer" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                <span className="font-bold">My Computer</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200 grid grid-cols-3 gap-4">
              {["Local Disk (C:)", "Local Disk (D:)", "CD-ROM (E:)", "Network", "Control Panel", "Printers"].map(
                (item) => (
                  <div key={item} className="flex flex-col items-center cursor-pointer">
                    <div className="w-12 h-12 bg-blue-700 flex items-center justify-center mb-1 hover:bg-blue-800">
                      <HardDrive className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-center">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeWindow === "documents" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <File className="w-4 h-4 mr-2" />
                <span className="font-bold">My Documents</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200">
              <p className="text-sm">No documents found.</p>
            </div>
          </div>
        )}

        {activeWindow === "recycle-bin" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="font-bold">Recycle Bin</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200">
              <p className="text-sm">Recycle Bin is empty.</p>
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
        <button className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600">
          <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-gray-600"></div>
          </div>
          Start
        </button>

        {/* Taskbar Programs */}
        <div className="flex-1 flex space-x-1 mx-2">
          <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
            <div className="w-4 h-4 mr-1 bg-white flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-600 bg-blue-600"></div>
            </div>
            Credits & History
          </button>
        </div>

        {/* System Tray */}
        <div className="flex items-center space-x-1">
          <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <CreditsPurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchaseComplete={handlePurchaseComplete}
        currentCredits={userCredits.credits}
      />
    </div>
  );
};

export default CreditsHistoryPage;