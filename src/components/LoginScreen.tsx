import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Key,
  ShieldCheck,
  Server,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { CyberGuardLogo } from './CyberGuardLogo.js';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: { username: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberSession, setRememberSession] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication rejected. Verify credentials.');
      }

      if (rememberSession) {
        localStorage.setItem('cyberguard_admin_token', data.token);
        localStorage.setItem('cyberguard_admin_user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('cyberguard_admin_token', data.token);
        sessionStorage.setItem('cyberguard_admin_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Access Denied: Invalid Security Clearance Credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('Admin');
    setPassword('admin');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050508] relative overflow-hidden select-none font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(183,148,246,0.12)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e0e18_1px,transparent_1px),linear-gradient(to_bottom,#0e0e18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="cyber-card rounded-3xl p-7 sm:p-9 border border-[#252538] bg-[#0A0A0F]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(183,148,246,0.15)] space-y-6">
          
          <div className="text-center space-y-2">
            <div className="flex justify-center pb-2">
              <CyberGuardLogo size="lg" showText={true} />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#B794F6]/10 text-[#B794F6] border border-[#B794F6]/30">
              <Lock className="w-3 h-3 text-[#B794F6]" />
              <span>Restricted VAPT Console Gate</span>
            </div>

            <p className="text-xs text-[#A0A0B0] pt-1">
              Authorized security personnel only. All access attempts are cryptographically audited and rate-limited.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Security Violation:</span>
                <p className="text-[11px] text-red-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#141420] border border-[#252538] text-xs text-[#A0A0B0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-[#B794F6]" />
              <span className="text-[11px]">
                Credentials: <strong className="text-white font-mono">Admin</strong> / <strong className="text-white font-mono">admin</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[10px] text-[#B794F6] hover:text-white font-semibold underline cursor-pointer"
            >
              Autofill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#B794F6]" />
                <span>Admin Username</span>
              </label>
              <div className="relative">
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Admin username"
                  className="w-full px-4 py-3 rounded-xl bg-[#050508] border border-[#252538] text-white text-sm font-mono placeholder-[#505068] focus:border-[#B794F6] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#B794F6]" />
                <span>Admin Password</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#050508] border border-[#252538] text-white text-sm font-mono placeholder-[#505068] focus:border-[#B794F6] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-white transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#A0A0B0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#B794F6] bg-[#050508] border-[#252538]"
                />
                <span>Persist encrypted session</span>
              </label>

              <span className="text-[11px] text-[#B794F6] font-mono">TLS 1.3 / AES-256</span>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold cyber-button-purple cursor-pointer shadow-[0_0_25px_rgba(183,148,246,0.4)] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#252538] grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#0e0e18] border border-[#1e1e2f]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
              <div className="text-[9px] font-bold text-white uppercase tracking-wider">SSRF Shield</div>
              <div className="text-[8px] text-[#A0A0B0]">Zero-Trust Filter</div>
            </div>

            <div className="p-2 rounded-lg bg-[#0e0e18] border border-[#1e1e2f]">
              <Lock className="w-3.5 h-3.5 text-[#B794F6]" />
              <div className="text-[9px] font-bold text-white uppercase tracking-wider">Brute Shield</div>
              <div className="text-[8px] text-[#A0A0B0]">Rate-Limit Guard</div>
            </div>

            <div className="p-2 rounded-lg bg-[#0e0e18] border border-[#1e1e2f]">
              <Server className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
              <div className="text-[9px] font-bold text-white uppercase tracking-wider">Bearer Token</div>
              <div className="text-[8px] text-[#A0A0B0]">Cryptographic</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] font-mono text-[#505068] flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CYBERGUARD HARDENED ENDPOINT • NODE JS PROXY ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
