"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, ArrowLeft, Clock, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Galaxy Background Component (same as auth page)
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

export default function InviteExpiredPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('invite_id');
  const errorType = searchParams.get('error');

  useEffect(() => {
    const originalBackground = document.body.style.background;
    document.body.style.background = 'transparent';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes glow-pulse {
        0%, 100% { text-shadow: 0 0 5px #5CC49D, 0 0 10px #5CC49D, 0 0 15px #5CC49D; transform: scale(1); }
        50% { text-shadow: 0 0 10px #5CC49D, 0 0 20px #5CC49D, 0 0 30px #5CC49D; transform: scale(1.1); }
      }
      .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
      .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.body.style.background = originalBackground;
      document.head.removeChild(style);
    };
  }, []);

  const handleResendRequest = async () => {
    if (!inviteId) {
      alert('Missing invite information. Please contact your admin.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSent(true);
      } else {
        alert(result.error || 'Failed to resend invite');
      }
    } catch (error) {
      alert('Failed to resend invite');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <GalaxyBackground />
        
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30 animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-300" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4 animate-glow-pulse">
                New Link Sent!
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                Check your email for a fresh magic link
              </p>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 mb-6">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Important:</strong> This link will expire in 1 hour, so click it soon!
                </p>
              </div>

              <Link 
                href="/login" 
                className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-200 hover:scale-105 hover:shadow-green-400/40 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <p>© 2025 ArbitrageOS. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <GalaxyBackground />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl animate-fade-in-up">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-400/30">
              <Clock className="w-10 h-10 text-yellow-300" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Link Expired
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              {errorType === 'invite_expired' 
                ? 'This invite has expired (7 days have passed).' 
                : 'This magic link has expired.'}
            </p>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300 text-left">
                  <p className="font-medium text-white mb-2">What happened?</p>
                  <ul className="space-y-1">
                    <li>• {errorType === 'invite_expired' ? 'Invites expire after 7 days' : 'Magic links expire after 1 hour'}</li>
                    <li>• The link has already been used</li>
                    <li>• Your session timing may have conflicted</li>
                  </ul>
                </div>
              </div>
            </div>

            {errorType !== 'invite_expired' && (
              <button
                onClick={handleResendRequest}
                disabled={loading || !inviteId}
                className="w-full bg-green-300 text-black font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:bg-green-200 hover:scale-105 hover:shadow-green-400/40 active:scale-95 mb-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending New Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Me a New Link
                  </>
                )}
              </button>
            )}

            {!inviteId && (
              <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-3 border border-red-400/30 mb-4 flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Missing invite information. Please contact your admin.
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Need help? Contact your administrator at{' '}
                <a href="mailto:team@growaiagency.io" className="text-green-400 hover:text-green-300 transition-colors">
                  team@growaiagency.io
                </a>
              </p>
              
              <Link 
                href="/login" 
                className="block w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <p>© 2025 ArbitrageOS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}