"use client";

import { useLogin } from "@refinedev/core";
import { useState, useEffect } from "react";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Building2, Users, Shield, Zap, TrendingUp, Target, XCircle, Lock, Eye, EyeOff } from "lucide-react";
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
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.3, '#000000');
      gradient.addColorStop(0.6, '#000000');
      gradient.addColorStop(1, '#000000');
      
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
        glowGradient.addColorStop(0, `rgba(92, 196, 157, ${finalOpacity * 0.9})`);
        glowGradient.addColorStop(0.5, `rgba(92, 196, 157, ${finalOpacity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(92, 196, 157, 0)');
        ctx.fillStyle = glowGradient;
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core star (green)
        ctx.beginPath();
        ctx.fillStyle = `rgba(92, 196, 157, ${finalOpacity})`;
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
      style={{ background: 'linear-gradient(135deg, #0b2520 0%, #0f2e2c 50%, #062f23 100%)' }}
    />
  );
};

// 3D Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0, color }: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
  color: string;
}) => {
  return (
    <div 
      className={`group p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 
        transform transition-all duration-700 hover:scale-105 hover:rotate-y-12 
        hover:shadow-2xl hover:shadow-${color}-500/30 hover:border-${color}-400/50
        animate-slide-in-left cursor-pointer perspective-1000`}
      style={{ 
        animationDelay: `${delay}ms`,
        transformStyle: 'preserve-3d',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl 
                     flex items-center justify-center flex-shrink-0 mt-1 
                     border border-white/20 group-hover:scale-110 
                     transition-all duration-500 group-hover:shadow-lg"
        >
          <Icon className={`w-5 h-5 text-${color}-400 group-hover:text-${color}-300 transition-colors duration-300`} />
        </div>
        <div className="group-hover:translate-x-2 transition-transform duration-500">
          <h3 className="font-semibold text-white mb-2 group-hover:text-white/90">{title}</h3>
          <p className="text-gray-300 text-sm group-hover:text-gray-200">{description}</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-xl 
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

// Animated Title Component
const AnimatedTitle = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 mb-8 perspective-1000">
      <span className="text-3xl font-bold text-white text-center overflow-hidden leading-tight">
        {mounted && (
          <>
            {["a", "r", "b", "i", "t", "r", "a", "g", "e", "O", "S"].map(
              (char, i) => (
                <span
                  key={`arbos-${i}`}
                  className={`inline-block ${
                    (char === "a" && i === 0) || char === "i"
                      ? "animate-glow-pulse text-[#5CC49D]"
                      : "animate-bounce-in"
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {char}
                </span>
              )
            )}
            <span
              className="inline-block animate-bounce-in"
              style={{ animationDelay: "1200ms", animationFillMode: "both" }}
            >
              &nbsp;b
            </span>
            <span
              className="inline-block animate-bounce-in"
              style={{ animationDelay: "1300ms", animationFillMode: "both" }}
            >
              y&nbsp;
            </span>
            {["G", "r", "o", "w", "A", "I"].map((char, i) => (
              <span
                key={`grow-${i}`}
                className="inline-block animate-bounce-in"
                style={{
                  animationDelay: `${1400 + i * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                {char}
              </span>
            ))}
          </>
        )}
      </span>
    </div>
  );
};

// Connecting Curves Component
const ConnectingCurves = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-16 left-0 w-full h-40">
        <div className="absolute top-4 left-12 z-20 animate-fade-in-up" style={{ animationDelay: '2s' }}>
          <div className="text-sm text-white/70 font-medium tracking-wider">
            <span className="text-[#5CC49D] animate-glow-pulse" style={{ animationDelay: '2.5s' }}>Automate</span>
            <span className="text-white/90">&</span>
            <span className="text-[#5CC49D] ml-1 font-bold">Grow</span>
          </div>
        </div>
        
        <svg className="absolute top-0 left-0 w-full h-32 opacity-30" viewBox="0 0 1200 150" fill="none">
          <defs>
            <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5CC49D" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#5CC49D" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M 50 75 Q 300 20 600 75 Q 900 130 1150 75"
            stroke="url(#topGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-line"
          />
          <path
            d="M 50 75 Q 300 20 600 75 Q 900 130 1150 75"
            stroke="rgba(92, 196, 157, 0.3)"
            strokeWidth="8"
            fill="none"
            className="animate-draw-line animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </svg>
      </div>

      <svg className="absolute bottom-20 left-0 w-full h-32 opacity-30" viewBox="0 0 1200 150" fill="none">
        <defs>
          <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5CC49D" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#5CC49D" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d="M 50 75 Q 300 130 600 75 Q 900 20 1150 75"
          stroke="url(#bottomGradient)"
          strokeWidth="2"
          fill="none"
          className="animate-draw-line"
          style={{ animationDelay: '0.5s' }}
        />
        <path
          d="M 50 75 Q 300 130 600 75 Q 900 20 1150 75"
          stroke="rgba(92, 196, 157, 0.3)"
          strokeWidth="8"
          fill="none"
          className="animate-draw-line animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </svg>
    </div>
  );
};

export const AuthPage = ({ type }: { type: "login" | "register" }) => {
  const { mutate: login } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false); // Toggle between password and magic link

  const [isNotInvited, setIsNotInvited] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [isNewInvitedUser, setIsNewInvitedUser] = useState(false);


  useEffect(() => {
    const originalBackground = document.body.style.background;
    document.body.style.background = 'transparent';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce-in {
        0% { opacity: 0; transform: translateY(-50px) rotateX(-90deg); }
        50% { transform: translateY(-10px) rotateX(-45deg); }
        100% { opacity: 1; transform: translateY(0) rotateX(0deg); }
      }
      @keyframes glow-pulse {
        0%, 100% { text-shadow: 0 0 5px #5CC49D, 0 0 10px #5CC49D, 0 0 15px #5CC49D; transform: scale(1); }
        50% { text-shadow: 0 0 10px #5CC49D, 0 0 20px #5CC49D, 0 0 30px #5CC49D; transform: scale(1.1); }
      }
      @keyframes slide-in-left {
        0% { opacity: 0; transform: translateX(-100px) rotateY(-30deg); }
        100% { opacity: 1; transform: translateX(0) rotateY(0deg); }
      }
      @keyframes draw-line {
        0% { stroke-dasharray: 0 1000; }
        100% { stroke-dasharray: 1000 0; }
      }
      @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
      .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
      .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
      .animate-draw-line { animation: draw-line 2s ease-in-out; }
      .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
      .perspective-1000 { perspective: 1000px; }
      .rotate-y-12:hover { transform: rotateY(12deg) scale(1.05); }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.body.style.background = originalBackground;
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsNotInvited(false);
    setNeedsPasswordSetup(false);
    setIsNewInvitedUser(false);
    setLoading(true);

    // Determine login method based on whether password is provided and useMagicLink toggle
    const loginPayload = useMagicLink
      ? { email, useMagicLink: true }
      : { email, password };

    login(
      loginPayload,
      {
        onSuccess: (data) => {
          setLoading(false);
          if (data.success) {
            if (useMagicLink) {
              setEmailSent(true);
              setMessage("Check your email for the magic link. It may take a moment to arrive.");
            }
            // For password login, RefineJS will handle redirect
          }
        },
        onError: (error: any) => {
          setLoading(false);
          const errorMessage = error?.message || "Login failed. Please try again.";
          setError(errorMessage);

          // Check if this is an "not invited" error
          if (errorMessage.includes("don't have access") || errorMessage.includes("Contact team@")) {
            setIsNotInvited(true);
          }

          // Check if user needs to set up password
          if (errorMessage.includes("haven't set up a password") || errorMessage.includes("PasswordNotSet")) {
            setNeedsPasswordSetup(true);
          }

          // Check if this is a new invited user who hasn't clicked the magic link yet
          if (errorMessage.includes("NewInvitedUser") || errorMessage.includes("click the magic link")) {
            setIsNewInvitedUser(true);
          }
        },
      }
    );
  };


  if (type === "register") {
    return (
      <div className="min-h-screen relative flex">
        <GalaxyBackground />
        <ConnectingCurves />
        
        <div className="relative z-10 w-full flex min-h-screen">
          <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 lg:translate-x-4 xl:translate-x-6">
            <div className="max-w-md space-y-6">
              <FeatureCard icon={Building2} title="Workspaces" description="create and manage workspaces" delay={200} color="green" />
              <FeatureCard icon={Shield} title="Tools" description="Generate and automate with arbitrage tools" delay={400} color="green" />
              <FeatureCard icon={Users} title="Submissions" description="View all recent deliverables in real time" delay={600} color="green" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-lg mx-auto lg:max-w-none lg:translate-x-8 xl:translate-x-12">
            <div className="w-full max-w-sm">
              <AnimatedTitle />
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
                    <Shield className="w-8 h-8 text-blue-300" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white mb-2">ArbitrageOS is Invite-Only</h1>
                  <p className="text-gray-300">Access to our platform is currently by invitation only</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-white mb-2">Interested in joining?</p>
                      <p className="mb-3">Contact our team to request an invitation and learn more about how ArbitrageOS can transform your workflow.</p>
                      <a href="mailto:team@growaiagency.io?subject=ArbitrageOS Access Request" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition-colors">
                        team@growaiagency.io
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-300"><strong className="text-white">Already invited?</strong> Check your email for your magic link, or sign in below.</p>
                </div>

                <Link href="/login" className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-200 hover:scale-105 hover:shadow-green-400/40 active:scale-95">
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 animate-fade-in-up" style={{ animationDelay: '1s' }}>
              <p>© 2025 ArbitrageOS. All rights reserved.</p>
            </div>
          </div>

          <div className="hidden xl:flex xl:flex-1 items-center justify-center p-12 xl:translate-x-20">
            <div className="max-w-md space-y-6">
              <FeatureCard icon={TrendingUp} title="Activity Heatmaps" description="Monitor activities and your usage stats." delay={800} color="green" />
              <FeatureCard icon={Target} title="Milestones" description="Set milestones for yourself and achieve them" delay={1000} color="green" />
              <FeatureCard icon={Zap} title="Directories" description="Access libraries & directories of various" delay={1200} color="green" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex">
      <GalaxyBackground />
      <ConnectingCurves />
      
      <div className="relative z-10 w-full flex min-h-screen">
        <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 lg:translate-x-4 xl:translate-x-6">
          <div className="max-w-md space-y-6">
            <FeatureCard icon={Building2} title="Workspaces" description="create and manage workspaces" delay={200} color="green" />
            <FeatureCard icon={Shield} title="Tools" description="Generate and automate with arbitrage tools" delay={400} color="green" />
            <FeatureCard icon={Users} title="Submissions" description="View all recent deliverables in real time" delay={600} color="green" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-lg mx-auto lg:max-w-none lg:translate-x-8 xl:translate-x-12">
          <div className="w-full max-w-sm">
            <AnimatedTitle />

            {emailSent ? (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30 animate-pulse">
                    <CheckCircle className="w-8 h-8 text-green-300" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
                  <p className="text-gray-300">We sent a magic link to <strong className="text-white">{email}</strong></p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
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

                <button onClick={() => { setEmailSent(false); setMessage(""); setError(""); setEmail(""); setPassword(""); setUseMagicLink(false); }} className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-white mb-2">Sign in to your account</h1>
                  <p className="text-gray-300">Enter your email to continue with ArbitrageOS</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 hover:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-400"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  {!useMagicLink && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required={!useMagicLink}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 hover:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-400"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className={`p-4 backdrop-blur-md rounded-lg border animate-fade-in-up ${
                      isNewInvitedUser
                        ? 'bg-green-500/10 border-green-400/30'
                        : needsPasswordSetup
                          ? 'bg-blue-500/10 border-blue-400/30'
                          : isNotInvited
                            ? 'bg-orange-500/10 border-orange-400/30'
                            : 'bg-red-500/10 border-red-400/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {isNewInvitedUser ? (
                          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-300" />
                        ) : needsPasswordSetup ? (
                          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-300" />
                        ) : (
                          <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            isNotInvited ? 'text-orange-300' : 'text-red-300'
                          }`} />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium mb-2 ${
                            isNewInvitedUser
                              ? 'text-green-200'
                              : needsPasswordSetup
                                ? 'text-blue-200'
                                : isNotInvited ? 'text-orange-200' : 'text-red-200'
                          }`}>
                            {isNewInvitedUser
                              ? 'Welcome to ArbitrageOS!'
                              : needsPasswordSetup
                                ? 'Password Setup Required'
                                : isNotInvited ? 'Access Required' : 'Authentication Error'}
                          </p>
                          <p className={`text-sm ${
                            isNewInvitedUser
                              ? 'text-green-300'
                              : needsPasswordSetup
                                ? 'text-blue-300'
                                : isNotInvited ? 'text-orange-300' : 'text-red-300'
                          }`}>
                            {isNewInvitedUser
                              ? "You've been invited! Please check your email and click the magic link to complete your account setup and create your password."
                              : needsPasswordSetup
                                ? "You're an existing user but haven't set up a password yet."
                                : error}
                          </p>
                          {isNewInvitedUser && (
                            <div className="mt-3 pt-3 border-t border-green-400/30">
                              <div className="space-y-2 text-sm text-green-300">
                                <p className="font-medium text-green-200">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                  <li>Check your email inbox (and spam folder)</li>
                                  <li>Click the magic link in the invitation email</li>
                                  <li>Create your password to complete setup</li>
                                </ol>
                              </div>
                              <p className="mt-3 text-xs text-green-400">
                                Can't find the email? Contact team@growaiagency.io for help.
                              </p>
                            </div>
                          )}
                          {needsPasswordSetup && (
                            <div className="mt-3 pt-3 border-t border-blue-400/30">
                              <button
                                type="button"
                                onClick={() => {
                                  setUseMagicLink(true);
                                  setError("");
                                  setNeedsPasswordSetup(false);
                                  setPassword("");
                                }}
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-blue-100 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                Use Magic Link to Set Password
                                <ArrowLeft className="w-3 h-3 rotate-180" />
                              </button>
                            </div>
                          )}
                          {isNotInvited && (
                            <div className="mt-3 pt-3 border-t border-orange-400/30">
                              <a
                                href="mailto:team@growaiagency.io?subject=ArbitrageOS Access Request&body=Hello, I would like to request access to ArbitrageOS.%0D%0A%0D%0AMy email: "
                                className="inline-flex items-center gap-2 text-sm font-medium text-orange-200 hover:text-orange-100 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                Request Access from Team
                                <ArrowLeft className="w-3 h-3 rotate-180" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (!useMagicLink && !password)}
                    className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-200 hover:scale-105 hover:shadow-green-400/40 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {useMagicLink ? 'Sending magic link...' : 'Signing in...'}
                      </>
                    ) : (
                      <>{useMagicLink ? 'Send magic link' : 'Sign in'}</>
                    )}
                  </button>

                  {/* Toggle between password and magic link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUseMagicLink(!useMagicLink);
                        setError("");
                        setPassword("");
                        setIsNewInvitedUser(false);
                      }}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {useMagicLink ? 'Sign in with password instead' : 'Sign in with magic link instead'}
                    </button>
                  </div>
                </form>

                {/* First-time user info */}
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-400">
                      <p className="font-medium text-gray-300 mb-1">First time here?</p>
                      <p>If you received an invitation email, click the magic link in that email first to set up your password. After that, you can sign in with your email and password.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-gray-200 transition-colors">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Secure authentication</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-gray-200 transition-colors">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Professional workspace management</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-300">
                  New to ArbitrageOS?{" "}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline">
                    Request access
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center text-xs text-gray-400 animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <p>© 2025 ArbitrageOS. All rights reserved.</p>
          </div>
        </div>

        <div className="hidden xl:flex xl:flex-1 items-center justify-center p-12 xl:translate-x-20">
          <div className="max-w-md space-y-6">
            <FeatureCard icon={TrendingUp} title="Activity Heatmaps" description="Monitor activities and your usage stats." delay={800} color="green" />
            <FeatureCard icon={Target} title="Milestones" description="Set milestones for yourself and achieve them" delay={1000} color="green" />
            <FeatureCard icon={Zap} title="Directories" description="Access libraries & directories of various" delay={1200} color="green" />
          </div>
        </div>
      </div>
    </div>
  );
};