"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { HardDrive, File, Trash2, Edit, Brush, Clock, Mail, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const AuthPage = ({ type }: { type: "login" | "register" }) => {
  const { mutate: login } = useLogin();
  const [showCreds, setShowCreds] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string>("auth");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    login(
      { email },
      {
        onSuccess: (data) => {
          setLoading(false);
          if (data.success) {
            setEmailSent(true);
            setMessage("Check your email for the magic link. It may take a moment to arrive.");
          }
        },
        onError: (error: any) => {
          setLoading(false);
          setError(error?.message || "Failed to send magic link. Please try again.");
        },
      }
    );
  };

  const renderAuthContent = () => {
    if (emailSent) {
      return (
        <div className="border-2 border-gray-400 bg-white p-6 space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-lg font-bold text-gray-800">Check Your Email</h2>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>We have sent a magic link to:</p>
            <div className="bg-gray-100 p-2 rounded border font-mono text-xs break-all">
              {email}
            </div>
            <p>Please check your email and click the magic link to sign in.</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Check your spam/junk folder if you do not see the email</li>
                  <li>The magic link expires after a few minutes for security</li>
                  <li>You can request a new link if needed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={() => {
                setEmailSent(false);
                setMessage("");
                setError("");
                setEmail("");
              }}
              className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              {message}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="border-2 border-gray-400 bg-white p-4 space-y-4">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {type === "login" ? "Sign In" : "Sign Up"} to Arbitrage-OS
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Enter your email to receive a magic link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 text-white font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              `Send magic link`
            )}
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">How it works:</p>
              <p>We will send you a secure magic link via email. Click the link to instantly sign in - no password required!</p>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-4 border-t border-gray-300">
          {type === "login" ? (
            <p className="text-sm">
              New to Arbitrage-OS?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 underline font-bold">
                Sign up
              </Link>
            </p>
          ) : (
            <p className="text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 underline font-bold">
                Sign in
              </Link>
            </p>
          )}
        </div>

        {showCreds && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs">
            <p className="font-bold mb-2">Demo Email:</p>
            <p>Email: demo@example.com</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => setShowCreds(!showCreds)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showCreds ? "Hide" : "Show"} Demo Email
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
      {/* Desktop Background */}
      <div className="flex-1 relative bg-[url('/win98-bg.jpg')] bg-cover bg-center p-4 overflow-hidden">
        {/* Desktop Icons Container */}
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

        {/* Auth Window */}
        {activeWindow === "auth" && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
              <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  <span className="font-bold">
                    Arbitrage-OS {emailSent ? "Magic Link Sent" : (type === "login" ? "Login" : "Register")}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">_</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">□</span>
                  </div>
                  <div
                    className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                    onClick={() => setActiveWindow("")}
                  >
                    <span className="text-xs">×</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-200">
                {renderAuthContent()}
                <div className="mt-4 flex justify-between items-center">
                  <button 
                    className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400"
                    onClick={() => {
                      setActiveWindow("");
                      setEmailSent(false);
                      setMessage("");
                      setError("");
                      setEmail("");
                    }}
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-600">Arbitrage-OS v1.0</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Windows (My Computer, Documents, Recycle Bin) - keeping your existing code */}
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
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          Start
        </button>

        {/* Taskbar Programs */}
        <div className="flex-1 flex space-x-1 mx-2">
          {activeWindow === "auth" && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              Arbitrage-OS {emailSent ? "Magic Link" : (type === "login" ? "Login" : "Register")}
            </button>
          )}
        </div>

        {/* System Tray */}
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