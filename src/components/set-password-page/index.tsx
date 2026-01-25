"use client";

import { useState, useEffect } from "react";
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient as supabase } from "@/utils/supabase/client";

// Animated Galaxy Background Component (same as auth-page)
const GalaxyBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];

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

    let animationFrame: number;
    const animate = () => {
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

      stars.forEach((star, index) => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;

        star.x += star.speed * (Math.sin(index * 0.1) * 0.5);
        star.y += star.speed * (Math.cos(index * 0.1) * 0.5);

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        const finalOpacity = star.opacity * twinkle;

        ctx.beginPath();
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
        glowGradient.addColorStop(0, `rgba(92, 196, 157, ${finalOpacity * 0.9})`);
        glowGradient.addColorStop(0.5, `rgba(92, 196, 157, ${finalOpacity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(92, 196, 157, 0)');
        ctx.fillStyle = glowGradient;
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

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

export const SetPasswordPage = ({ email }: { email: string }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
      .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
      .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
      .perspective-1000 { perspective: 1000px; }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.background = originalBackground;
      document.head.removeChild(style);
    };
  }, []);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pass)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pass)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Update password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to set password");
        setLoading(false);
        return;
      }

      // Call API to mark user as having set their password
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to complete password setup");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      console.error('Set password error:', err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <GalaxyBackground />

      <div className="relative z-10 w-full max-w-md p-8">
        <AnimatedTitle />

        {success ? (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30 animate-pulse">
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Password Set Successfully!</h1>
              <p className="text-gray-300">You can now login with your email and password.</p>
              <p className="text-gray-400 text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30">
                <Lock className="w-8 h-8 text-green-300" />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">Create Your Password</h1>
              <p className="text-gray-300">Set a secure password for your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email display (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
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

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < getPasswordStrength() ? strengthColors[getPasswordStrength() - 1] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      getPasswordStrength() < 3 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {strengthLabels[getPasswordStrength() - 1] || 'Enter a password'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 hover:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-400"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 backdrop-blur-md rounded-lg border border-red-400/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Password requirements */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                <p className="text-sm text-gray-300 font-medium mb-2">Password requirements:</p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li className={password.length >= 8 ? 'text-green-400' : ''}>
                    {password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>
                    {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>
                    {/[0-9]/.test(password) ? '✓' : '○'} One number
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || !password}
                className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-200 hover:scale-105 hover:shadow-green-400/40 active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Create Password & Continue
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <p>By creating a password, you agree to our Terms of Service</p>
          <p className="mt-2">&copy; 2025 ArbitrageOS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
