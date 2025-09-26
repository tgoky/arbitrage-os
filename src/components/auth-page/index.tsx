"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Building2, Users, Shield, Zap, TrendingUp, Target } from "lucide-react";
import Link from "next/link";

// Animated Galaxy Background Component
const GalaxyBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star properties
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];

    // Create stars
    const createStars = () => {
      const numStars = Math.floor((canvas.width * canvas.height) / 8000);
      stars.length = 0;
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.2 + 0.05,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    };

    createStars();

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      // Create galaxy gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, '#4e9122');
      gradient.addColorStop(0.3, '#1f4d11');
      gradient.addColorStop(0.6, '#293d1b');
      gradient.addColorStop(1, '#0a0a1a');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and animate stars
      stars.forEach((star, index) => {
        // Update twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        
        // Slow drift
        star.x += star.speed * (Math.sin(index * 0.1) * 0.5);
        star.y += star.speed * (Math.cos(index * 0.1) * 0.5);
        
        // Wrap around edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Draw star with glow
        const finalOpacity = star.opacity * twinkle;
        
        // Outer glow
        ctx.beginPath();
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity * 0.8})`);
        glowGradient.addColorStop(0.5, `rgba(200, 220, 255, ${finalOpacity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      id="galaxy-canvas"
      className="fixed inset-0 w-full h-full -z-10"
      style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a0f2e 50%, #0a0a1a 100%)' }}
    />
  );
};

export const AuthPage = ({ type }: { type: "login" | "register" }) => {
  const { mutate: login } = useLogin();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Override body background for auth pages only
    const originalBackground = document.body.style.background;
    document.body.style.background = 'transparent';
    
    return () => {
      document.body.style.background = originalBackground;
    };
  }, []);

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

  return (
    <div className="min-h-screen relative flex">
      {/* Animated Galaxy Background */}
      <GalaxyBackground />
      
      {/* Content Overlay */}
      <div className="relative z-10 w-full flex">
        {/* Left Panel - Feature Cards */}
        <div className="flex-1 hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-400/30">
                    <Building2 className="w-4 h-4 text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-white">Professional Workspaces</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Manage clients, projects, and team members in organized workspaces designed for business professionals.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-green-400/30">
                    <Shield className="w-4 h-4 text-green-300" />
                  </div>
                  <h3 className="font-semibold text-white">Enterprise Security</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Bank-level security with magic link authentication. No passwords to remember or manage.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-purple-400/30">
                    <Users className="w-4 h-4 text-purple-300" />
                  </div>
                  <h3 className="font-semibold text-white">Team Collaboration</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Invite team members, assign roles, and collaborate seamlessly across projects and clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-8">
              
              <span className="text-2xl font-semibold text-white">welcome to   <span style={{ color: '#5CC49D' }}>a</span>rb
  <span style={{ color: '#5CC49D' }}>i</span>trageOS</span>
            </div>
          <div className="w-full max-w-sm">
            {/* Logo */}
          

            {/* Content */}
            {emailSent ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30">
                    <CheckCircle className="w-8 h-8 text-green-300" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white mb-2">
                    Check your email
                  </h1>
                  <p className="text-gray-300">
                    We sent a magic link to <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-white mb-1">Did not receive the email?</p>
                      <ul className="space-y-1">
                        <li>• Check your spam folder</li>
                        <li>• Make sure you entered the correct email</li>
                        <li>• Wait a few minutes and try again</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEmailSent(false);
                    setMessage("");
                    setError("");
                    setEmail("");
                  }}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white mb-2">
                    {type === "login" ? "Sign in to your account" : "Create your account"}
                  </h1>
                  <p className="text-gray-300">
                    Enter your email to continue with ArbitrageOS
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-400"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 backdrop-blur-md border border-red-400/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending magic link...
                      </>
                    ) : (
                      <>
                        Continue with email
                      </>
                    )}
                  </button>
                </form>

                <div className="border-t border-white/20 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Secure passwordless authentication</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Professional workspace management</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-300">
                  {type === "login" ? (
                    <>
                      Do not have an account?{" "}
                      <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Sign up
                      </Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-gray-400">
            <p>© 2024 ArbitrageOS. All rights reserved.</p>
          </div>
        </div>

        {/* Right Panel - Platform Benefits */}
        <div className="flex-1 hidden xl:flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="space-y-8">
            

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <div className="w-8 h-8 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border border-blue-400/30">
                    <TrendingUp className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Real-time Analytics</h3>
                    <p className="text-gray-300 text-sm">Monitor market conditions and identify opportunities as they emerge with live data feeds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <div className="w-8 h-8 bg-green-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border border-green-400/30">
                    <Target className="w-4 h-4 text-green-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Precision Targeting</h3>
                    <p className="text-gray-300 text-sm">Advanced algorithms to pinpoint high-probability arbitrage opportunities across markets.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <div className="w-8 h-8 bg-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border border-purple-400/30">
                    <Zap className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Lightning Fast Execution</h3>
                    <p className="text-gray-300 text-sm">Automated systems designed for rapid execution when opportunities are identified.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};