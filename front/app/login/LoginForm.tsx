'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, verify2FA } from '@/services/auth';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, Shield, BarChart3, Users, Zap, MessageSquare } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA State
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await login(email, password);

      if (response.two_factor) {
        setTempToken(response.temp_token);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (err: any) {
      const axiosError = err as any;
      let errorMessage = "Erreur de connexion. Verifiez l'etat de l'API.";

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          errorMessage = "Identifiants incorrects.";
        }
        else if (axiosError.response.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (axiosError.request) {
        errorMessage = "Serveur injoignable. Verifiez votre connexion.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(otp, tempToken);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      setError("Code invalide. Veuillez reessayer.");
      setLoading(false);
    }
  };

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, title: "Dashboard intelligent", desc: "Vue complete de votre activite" },
    { icon: <Users className="w-5 h-5" />, title: "Gestion clients & prospects", desc: "Suivi complet de vos relations" },
    { icon: <Zap className="w-5 h-5" />, title: "IA integree", desc: "Analyse et suggestions automatiques" },
    { icon: <MessageSquare className="w-5 h-5" />, title: "Messagerie temps reel", desc: "Communication interne fluide" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left Branding Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] " />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/25">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="text-white/90 font-bold text-xl tracking-tight">NetStrategy</span>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Votre CRM<br />
                <span className="text-white/70">nouvelle generation</span>
              </h2>
              <p className="text-white/60 mt-4 text-lg leading-relaxed max-w-md">
                Gerez vos clients, prospects et projets avec une plateforme pensee pour la performance.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-white/10 text-white group-hover:bg-white/20 transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{f.title}</p>
                    <p className="text-white/50 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">
            Net Strategy {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 dark:bg-indigo-900/10 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-[80px]" />

        <div className="w-full max-w-md px-6 md:px-8 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">NetStrategy</span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-200/50 dark:border-slate-800/50 p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-5 shadow-lg shadow-indigo-500/25">
                {show2FA ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                {show2FA ? 'Verification 2FA' : 'Connexion'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {show2FA ? "Entrez le code de votre application d'authentification" : 'Accedez a votre espace de gestion'}
              </p>
            </div>

            {show2FA ? (
              <form className="space-y-5" onSubmit={handle2FASubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Code A2F
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-medium text-center tracking-[0.3em] text-lg"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80 disabled:cursor-wait"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Verification...</span></>
                  ) : (
                    <><span>Confirmer</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setShow2FA(false); setOtp(''); setError(''); }}
                  className="w-full text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium py-2"
                >
                  Retour a la connexion
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Adresse Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                        placeholder="nom@exemple.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-medium"
                        placeholder="Votre mot de passe"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80 disabled:cursor-wait"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Connexion...</span></>
                  ) : (
                    <><span>Se connecter</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                NetStrategy CRM {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
