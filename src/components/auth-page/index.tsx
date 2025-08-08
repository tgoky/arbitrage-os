"use client";

import { AuthPage as AuthPageBase } from "@refinedev/core";
import type { AuthPageProps } from "@refinedev/core";
import { useState } from "react";

export const AuthPage = (props: AuthPageProps) => {
  const [showCreds, setShowCreds] = useState(false);

  return (
    <AuthPageBase
      {...props}
      renderContent={(content) => (
        <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
          {/* Windows 98 Login Window */}
          <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
            {/* Title Bar */}
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
                <span className="font-bold">Arbitrage-OS Login</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">_</span>
                </div>
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 bg-gray-200">
              {/* Demo Credentials Button */}
              <button
                onClick={() => setShowCreds(!showCreds)}
                className="w-full mb-4 px-4 py-2 bg-blue-700 text-white border-2 border-gray-400 font-bold hover:bg-blue-800 active:border-gray-500 active:bg-blue-900"
              >
                {showCreds ? "Hide Demo Credentials" : "Show Demo Credentials"}
              </button>
              
              {showCreds && (
                <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-300 text-blue-800">
                  <p className="font-bold">Demo Account:</p>
                  <p>Username: demo@refine.dev</p>
                  <p>Password: demodemo</p>
                </div>
              )}
              
              {/* Auth Content */}
              <div className="border-2 border-gray-400 bg-white p-4">
                {content}
              </div>
              
              {/* Footer */}
              <div className="mt-4 flex justify-between items-center">
                <button className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400">
                  Cancel
                </button>
                <div className="text-xs text-gray-600">
                  Arbitrage-OS v1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      formProps={{
        wrapperProps: {
          className: "space-y-4"
        },
        contentProps: {
          className: "space-y-4"
        }
      }}
    />
  );
};