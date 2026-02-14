"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfigProvider } from "antd";
import { supabaseBrowserClient as supabase } from "@/utils/supabase/client";

// --- STYLING CONSTANTS from submissions file ---
const BRAND_COLOR = '#5CC49D'; // Mint Green
const STEEL_COLOR = '#9DA2B3';
const SPACE_BG = '#000000';
const GLASS_BG = 'rgba(255, 255, 255, 0.03)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.08)';

export const AuthPage = ({ type }: { type: "login" | "register" }) => {
  const { mutate: login } = useLogin();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNotInvited, setIsNotInvited] = useState(false);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);

  // Add Manrope font to document
  useEffect(() => {
    // Check if Manrope is already loaded
    if (!document.querySelector('#manrope-font')) {
      const link = document.createElement('link');
      link.id = 'manrope-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Set body background
    document.body.style.backgroundColor = SPACE_BG;
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Handle invite_id and access token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite_id');
    const hash = window.location.hash;
    
    if (inviteId && !hash) {
      console.log('Processing invite:', inviteId);
      setMessage('Please check your email for the magic link to complete sign in.');
    } else if (inviteId && hash) {
      console.log('Invite detected with token, processing automatically...');
    }
  }, []);

  // Handle access token from URL fragment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite_id');
      
      if (hash && hash.includes('access_token')) {
        const fragmentParams = new URLSearchParams(hash.substring(1));
        const accessToken = fragmentParams.get('access_token');
        const refreshToken = fragmentParams.get('refresh_token');
        const type = fragmentParams.get('type');
        
        console.log('Found tokens in URL fragment:', { 
          hasAccessToken: !!accessToken, 
          type,
          inviteId 
        });
        
        if (accessToken) {
          setLoading(true);
          
          const setSession = async () => {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (error) {
                console.error('Error setting session:', error);
                setError('Failed to authenticate. Please try again.');
                setLoading(false);
              } else {
                console.log('Session set successfully:', data.session?.user.id);
                
                window.location.hash = '';
                
                if (inviteId) {
                  try {
                    await fetch('/api/auth/accept-invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ inviteId })
                    });
                    console.log('Invite accepted successfully');
                  } catch (inviteError) {
                    console.error('Error accepting invite:', inviteError);
                  }
                }
                
                router.push('/home');
              }
            } catch (error) {
              console.error('Error in setSession:', error);
              setError('Authentication failed. Please try again.');
              setLoading(false);
            }
          };
          
          setSession();
        }
      }
    }
  }, [router]);

  const handlePasswordLogin = async () => {
    setMessage("");
    setError("");
    setIsNotInvited(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Login successful! Redirecting...");
        router.push(data.redirectTo || '/home');
      } else {
        setError(data.error || "Login failed. Please try again.");
        if (data.error?.includes("don't have access") || data.error?.includes("Contact")) {
          setIsNotInvited(true);
        }
      }
    } catch (err: any) {
      console.error('Password login error:', err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsNotInvited(false);

    if (usePasswordLogin) {
      handlePasswordLogin();
      return;
    }

    setLoading(true);

    login(
      { email },
      {
        onSuccess: (data: any) => {
          setLoading(false);
          if (data.success) {
            setEmailSent(true);
            setMessage("Check your email for the magic link. It may take a moment to arrive.");
          } else {
            const errorMessage = data?.error?.message || "Failed to send magic link. Please try again.";
            setError(errorMessage);
            if (errorMessage.includes("don't have access") || errorMessage.includes("Contact team@")) {
              setIsNotInvited(true);
            }
          }
        },
        onError: (error: any) => {
          setLoading(false);
          const errorMessage = error?.message || "Failed to send magic link. Please try again.";
          setError(errorMessage);
          if (errorMessage.includes("don't have access") || errorMessage.includes("Contact team@")) {
            setIsNotInvited(true);
          }
        },
      }
    );
  };

  // Registration page
  if (type === "register") {
    return (
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "'Manrope', sans-serif",
            colorPrimary: BRAND_COLOR,
            colorBgBase: SPACE_BG,
            colorTextBase: '#fff',
            colorBorder: GLASS_BORDER,
            borderRadius: 8,
          },
        }}
      >
        <style jsx global>{`
          body {
            background-color: ${SPACE_BG};
            font-family: 'Manrope', sans-serif;
            margin: 0;
            padding: 0;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>

        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: SPACE_BG }}>
          <div className="w-full max-w-md">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 font-manrope tracking-tight">
                ArbitrageOS
              </h1>
              <p className="text-sm" style={{ color: STEEL_COLOR }}>by GrowAI</p>
            </div>

            {/* Main Card */}
            <div 
              className="rounded-xl p-8 border"
              style={{ 
                background: GLASS_BG, 
                borderColor: GLASS_BORDER,
              }}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(92, 196, 157, 0.1)' }}
                >
                  <Lock className="w-8 h-8" style={{ color: BRAND_COLOR }} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2 font-manrope">
                  Invite-Only Platform
                </h2>
                <p className="text-sm" style={{ color: STEEL_COLOR }}>
                  Access to ArbitrageOS is currently by invitation only
                </p>
              </div>

              <div 
                className="rounded-lg p-5 mb-5 border"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderColor: GLASS_BORDER 
                }}
              >
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLOR }} />
                  <div>
                    <p className="font-medium text-white mb-2 text-sm">Interested in joining?</p>
                    <p className="text-xs mb-3" style={{ color: STEEL_COLOR }}>
                      Contact our team to request an invitation and learn more about how ArbitrageOS can transform your workflow.
                    </p>
                    <a 
                      href="mailto:team@growaiagency.io?subject=ArbitrageOS Access Request" 
                      className="inline-flex items-center gap-2 text-xs font-medium transition-colors"
                      style={{ color: BRAND_COLOR }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#7ed9b0'}
                      onMouseLeave={(e) => e.currentTarget.style.color = BRAND_COLOR}
                    >
                      team@growaiagency.io
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </a>
                  </div>
                </div>
              </div>

              <div 
                className="rounded-lg p-4 mb-6 text-center border"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderColor: GLASS_BORDER 
                }}
              >
                <p className="text-xs" style={{ color: STEEL_COLOR }}>
                  <span className="text-white">Already invited?</span> Check your email for your magic link, or sign in below.
                </p>
              </div>

              <Link href="/login" className="block w-full">
                <button
                  className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  style={{ 
                    backgroundColor: BRAND_COLOR,
                    color: '#000',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7ed9b0';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLOR;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs" style={{ color: '#666' }}>
                © 2025 ArbitrageOS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // Login page
// Login page - replace the return section with this:
return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Manrope', sans-serif",
          colorPrimary: BRAND_COLOR,
          colorBgBase: SPACE_BG,
          colorTextBase: '#fff',
          colorBorder: GLASS_BORDER,
          borderRadius: 8,
        },
      }}
    >
      <style jsx global>{`
        body {
          background-color: ${SPACE_BG} !important;
          font-family: 'Manrope', sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        * {
          box-sizing: border-box;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: white;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px transparent;
        }
        /* Override any base styles that might affect centering */
        .auth-container {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .auth-card {
          margin-left: auto !important;
          margin-right: auto !important;
          width: 100% !important;
        }
      `}</style>

      <div className="auth-container" style={{ backgroundColor: SPACE_BG }}>
        <div className="w-full max-w-md px-4 py-8 auth-card">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 font-manrope tracking-tight" style={{ margin: 0 }}>
              arbitrageOS
            </h1>
            <p className="text-sm" style={{ color: STEEL_COLOR, margin: 0 }}>by GrowAI</p>
          </div>

          {emailSent ? (
            // Email Sent State
            <div 
              className="rounded-xl p-8 border"
              style={{ 
                background: GLASS_BG, 
                borderColor: GLASS_BORDER,
              }}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(92, 196, 157, 0.1)' }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: BRAND_COLOR }} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2 font-manrope" style={{ margin: 0 }}>
                  Check your email
                </h2>
                <p className="text-sm" style={{ color: STEEL_COLOR, marginTop: '0.5rem' }}>
                  We sent a magic link to <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div 
                className="rounded-lg p-4 mb-6 border"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderColor: GLASS_BORDER 
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: STEEL_COLOR }} />
                  <div>
                    <p className="font-medium text-white mb-2 text-sm">Did not receive the email?</p>
                    <ul className="space-y-1 text-xs" style={{ color: STEEL_COLOR, listStyle: 'none', padding: 0, margin: 0 }}>
                      <li>• Check your spam folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Wait a few minutes and try again</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setEmailSent(false); setMessage(""); setError(""); setEmail(""); }} 
                className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm border"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: GLASS_BORDER,
                  color: '#fff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = GLASS_BG;
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = GLASS_BORDER;
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          ) : (
            // Login Form
            <div 
              className="rounded-xl p-8 border"
              style={{ 
                background: GLASS_BG, 
                borderColor: GLASS_BORDER,
              }}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2 font-manrope" style={{ margin: 0 }}>
                  Sign in to your account
                </h2>
                <p className="text-sm" style={{ color: STEEL_COLOR, marginTop: '0.5rem' }}>
                  {usePasswordLogin
                    ? "Enter your email and password"
                    : "Enter your email to continue"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-2" style={{ color: STEEL_COLOR }}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: STEEL_COLOR }} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-9 pr-4 py-3 rounded-lg border text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderColor: GLASS_BORDER,
                        color: '#fff',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = BRAND_COLOR}
                      onBlur={(e) => e.target.style.borderColor = GLASS_BORDER}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                {usePasswordLogin && (
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium mb-2" style={{ color: STEEL_COLOR }}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: STEEL_COLOR }} />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pl-9 pr-10 py-3 rounded-lg border text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderColor: GLASS_BORDER,
                          color: '#ffffff',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = BRAND_COLOR}
                        onBlur={(e) => e.target.style.borderColor = GLASS_BORDER}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                        style={{ color: STEEL_COLOR, backgroundColor: '#000000', borderColor: '#000000' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = STEEL_COLOR}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div 
                    className={`p-4 rounded-lg border ${
                      isNotInvited ? 'border-orange-500/30' : 'border-red-500/30'
                    }`}
                    style={{ 
                      background: isNotInvited ? 'rgba(255, 140, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        isNotInvited ? 'text-orange-500' : 'text-red-500'
                      }`} />
                      <div className="flex-1">
                        <p className={`font-medium mb-1 text-sm ${
                          isNotInvited ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {isNotInvited ? 'Access Required' : 'Authentication Error'}
                        </p>
                        <p className="text-xs" style={{ color: STEEL_COLOR }}>
                          {error}
                        </p>
                        {isNotInvited && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255, 140, 0, 0.2)' }}>
                            <a
                              href="mailto:team@growaiagency.io?subject=ArbitrageOS Access Request&body=Hello, I would like to request access to ArbitrageOS.%0D%0A%0D%0AMy email: "
                              className="inline-flex items-center gap-2 text-xs font-medium transition-colors"
                              style={{ color: '#ff8c00' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ffaa33'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#ff8c00'}
                            >
                              <Mail className="w-3 h-3" />
                              Request Access from Team
                              <ArrowLeft className="w-3 h-3 rotate-180" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {message && (
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ 
                      background: 'rgba(92, 196, 157, 0.05)',
                      borderColor: 'rgba(92, 196, 157, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" style={{ color: BRAND_COLOR }} />
                      <p className="text-xs" style={{ color: BRAND_COLOR }}>{message}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (usePasswordLogin && !password)}
                  className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  style={{ 
                    backgroundColor: BRAND_COLOR,
                    color: '#000',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !(usePasswordLogin && !password)) {
                      e.currentTarget.style.backgroundColor = '#7ed9b0';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLOR;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {usePasswordLogin ? "Signing in..." : "Sending magic link..."}
                    </>
                  ) : (
                    <>
                      {usePasswordLogin ? (
                        <>
                          <Lock className="w-4 h-4" />
                          Sign in with Password
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Continue with Magic Link
                        </>
                      )}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Login Method */}
              <div className="text-center mt-4">
                <button
                  type="button"
           
                  onClick={() => {
                    setUsePasswordLogin(!usePasswordLogin);
                    setError("");
                    setMessage("");
                    setPassword("");
                  }}
                  className="text-xs transition-colors"
                  style={{ color: STEEL_COLOR , backgroundColor:'#000000', borderColor: '#000000'}}
                  onMouseEnter={(e) => e.currentTarget.style.color = BRAND_COLOR}
                  onMouseLeave={(e) => e.currentTarget.style.color = STEEL_COLOR}
                >
                  {usePasswordLogin ? (
                    <>
                      <Mail className="w-3 h-3 inline mr-1" />
                      Use magic link instead
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 inline mr-1" />
                      Sign in with password
                    </>
                  )}
                </button>
              </div>

              {/* Features List */}
              <div className="border-t mt-6 pt-6" style={{ borderColor: GLASS_BORDER }}>
                <div className="space-y-3">
                
                 
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center mt-6">
                {/* <p className="text-xs" style={{ color: STEEL_COLOR }}>
                  New to ArbitrageOS?{" "}
                  <Link 
                    href="/register" 
                    className="font-medium transition-colors"
                    style={{ color: BRAND_COLOR }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#7ed9b0'}
                    onMouseLeave={(e) => e.currentTarget.style.color = BRAND_COLOR}
                  >
                    Request access
                  </Link>
                </p> */}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs" style={{ color: '#666' }}>
              © 2026 ArbitrageOS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};