"use client";

"use client";

import { useState, useEffect } from 'react';
import { useGetIdentity } from "@refinedev/core";
import { useTheme } from "../../providers/ThemeProvider";
import Head from 'next/head';
import Script from 'next/script';

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
  const { theme } = useTheme();
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();

  // Initialize both widgets when component mounts
  useEffect(() => {
    const initializeWidgets = () => {
      console.log('Initializing FeatureBase widgets...');
      const win = window as any;

      if (typeof win.Featurebase !== "function") {
        win.Featurebase = function () {
          (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
        };
      }

      // Initialize Feedback Widget (simple, no appId required)
      win.Featurebase(
        'initialize_feedback_widget',
        {
          organization: 'arbitrageos',
          theme: theme === 'dark' ? 'dark' : 'light',
          email: identity?.email || '',
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

      // // Initialize Messenger Widget (requires appId and proper setup)
      // // Uncomment and configure this if you want the messenger functionality
      
      win.Featurebase(
        'boot',
        {
          organization: 'arbitrageos',
          appId: '68ad0000ca0725a8ad587523', // Replace with your real appId
          theme: theme === 'dark' ? 'dark' : 'light',
          email: identity?.email || '',
          locale: 'en',
          // userHash: 'YOUR_USER_HASH', // Required if identity verification is enabled
        },
        (err: any, callback: any) => {
          console.log('Messenger callback:', { err, callback });
          
          if (err) {
            console.error('Messenger error:', err);
          }
          
          if (callback?.action === 'widgetReady') {
            console.log('Messenger ready!');
            setMessengerReady(true);
          }
        }
      );
      
    };

    // Initialize when user data is available
    if (identity && !isLoading) {
      const timer = setTimeout(initializeWidgets, 500);
      return () => clearTimeout(timer);
    }
  }, [identity, theme, isLoading]);

  const handleFeedbackWidget = () => {
    if (!identity) {
      alert('Please log in to submit feedback');
      return;
    }

    if (!feedbackWidgetReady) {
      alert('Feedback widget is still loading. Please try again in a moment.');
      return;
    }

    // The data-featurebase-feedback attribute will handle this automatically
    console.log('Opening feedback widget...');
  };

  const handleMessenger = () => {
    if (!identity) {
      alert('Please log in to open messenger');
      return;
    }

    if (!messengerReady) {
      alert('Messenger is not available. Make sure it is properly configured.');
      return;
    }

    try {
      (window as any).Featurebase('show');
      console.log('Opening messenger...');
    } catch (e) {
      console.error('Failed to open messenger:', e);
      alert('Messenger is not properly configured.');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black-900' : 'bg-black-50'}`}>
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Have something to say?
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Tell us how we could make the product more useful to you.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Tabs */}
       <div
  className={`flex mb-6 border-b ${
    isDark ? "border-gray-700" : "border-gray-200"
  }`}
>
  {["New", "Top", "Trending"].map((tab) => (
    <button
      key={tab}
      className={`px-4 py-2 font-medium transition-colors ${
        activeTab === tab.toLowerCase()
          ? "text-blue-600 border-b-2 border-blue-600"
          : isDark
            ? "text-gray-400 hover:text-gray-300"
            : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={() => setActiveTab(tab.toLowerCase())}
    >
      {tab}
    </button>
  ))}
</div>


            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search feedback..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <svg
                  className={`absolute right-3 top-2.5 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Widget Options */}
            <div className="mb-8 space-y-4">
              {/* Feedback Widget Button */}
              <button
                data-featurebase-feedback
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleFeedbackWidget}
                disabled={!identity || isLoading || !feedbackWidgetReady}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {!identity ? 'Login Required' : !feedbackWidgetReady ? 'Loading...' : 'Submit Feedback (Form)'}
              </button>

              {/* Messenger Button */}
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleMessenger}
                disabled={!identity || isLoading || !messengerReady}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {!identity ? 'Login Required' : !messengerReady ? 'Messenger Not Available' : 'Open Chat Support'}
              </button>

              {/* Alternative style button */}
              <button
                data-featurebase-feedback
                onClick={handleFeedbackWidget}
                className={`w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50'
                }`}
                disabled={!identity || isLoading || !feedbackWidgetReady}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="font-medium">Quick Feedback</span>
              </button>
            </div>

            {/* User Info Display */}
            {identity && (
              <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-3">
                  {identity.avatar ? (
                    <img 
                      src={identity.avatar} 
                      alt={identity.name || identity.email || "User"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {identity.name?.charAt(0).toUpperCase() || identity.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                       {identity.name || 'User'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {identity.email}
                    </p>
                    {/* <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>Feedback Widget: {feedbackWidgetReady ? '✅ Ready' : '⏳ Loading...'}</span>
                      <br />
                      <span>Messenger: {messengerReady ? '✅ Ready' : '❌ Not configured'}</span>
                    </div> */}
                  </div>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="space-y-6">
              <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Two Ways to Give Feedback
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      Feedback Form
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Quick popup form for submitting feature requests and bug reports with screenshot tools.
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium mb-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                      Chat Support
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Full messenger interface for detailed conversations, support, and feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className={`rounded-xl shadow-sm p-6 border sticky top-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Feedback Categories
              </h3>
              
              <div className="space-y-3 mb-6">
                {[
                  { key: 'all', label: 'All Feedback', icon: '📝' },
                  { key: 'feature-request', label: 'Feature Requests', icon: '💡' },
                  { key: 'bug-reports', label: 'Bug Reports', icon: '🐛' },
                  { key: 'general', label: 'General Feedback', icon: '💬' }
                ].map((type) => (
                  <div key={type.key} className="flex items-center">
                    <input
                      id={`filter-${type.key}`}
                      type="radio"
                      name="filter"
                      checked={filter === type.key}
                      onChange={() => setFilter(type.key)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={`filter-${type.key}`} className={`ml-2 text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span>{type.icon}</span>
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Quick feedback button in sidebar */}
              <button
                data-featurebase-feedback
                onClick={handleFeedbackWidget}
                className={`w-full p-3 rounded-lg border-2 border-dashed transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }`}
                disabled={!feedbackWidgetReady}
              >
                <span className="text-sm font-medium">Quick Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
