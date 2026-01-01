import React, { useState } from 'react';
import { Calendar, Loader2, ArrowRight, Lock, Mail, Gavel, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper para traduzir erros do Supabase
  const getFriendlyErrorMessage = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('user already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (msg.includes('invalid') && msg.includes('email')) return 'Formato de e-mail inválido.';
    if (msg.includes('too many requests')) return 'Muitas tentativas. Tente novamente mais tarde.';
    return errorMsg; // Retorna original se não mapeado
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // 1. Sanitização e Validação Local
    const cleanEmail = email.trim().toLowerCase();
    
    // Regex simples para garantir formato básico de email antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
        setError('O endereço de e-mail inserido é inválido.');
        setLoading(false);
        return;
    }

    try {
        if (isSignUp) {
            const { error: signUpError } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
            });
            if (signUpError) throw signUpError;
            setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
            setIsSignUp(false); 
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
            });
            if (signInError) throw signInError;
            onLogin();
        }
    } catch (err: any) {
        console.error('Auth Error:', err);
        // Tratamento robusto para extrair a mensagem de erro
        let rawMsg = 'Erro desconhecido';
        if (typeof err === 'string') {
            rawMsg = err;
        } else if (err?.message) {
            rawMsg = err.message;
        } else if (err?.error_description) {
            rawMsg = err.error_description;
        }
        
        setError(getFriendlyErrorMessage(rawMsg));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-accent selection:text-white">
      
      {/* --- BACKGROUND ARCHITECTURE --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/10 rounded-full blur-[120px] mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] bg-stone-800/50 rounded-full blur-[100px]"></div>
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vh] h-[160vh] opacity-10 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-stone-500" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="4 4" className="text-accent" />
        </svg>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(197, 160, 89, 0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="text-center mb-10 relative">
            <div className="inline-flex items-center justify-center relative mb-6 group">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full group-hover:bg-accent/30 transition-all duration-500"></div>
                <div className="relative w-20 h-20 bg-stone-900 border border-stone-700/50 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 group-hover:border-accent/50">
                    <Calendar className="w-8 h-8 text-accent group-hover:rotate-12 transition-transform duration-500" strokeWidth={1.5} />
                    <div className="absolute inset-0 rounded-full border border-transparent border-t-accent/40 animate-[spin_3s_linear_infinite]"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-accent text-stone-950 p-1.5 rounded-full border-4 border-stone-950 shadow-lg">
                    <Gavel className="w-4 h-4" />
                </div>
            </div>
            <h1 className="text-5xl font-serif italic text-white tracking-tight leading-none">
                Lote<span className="text-accent">Certo</span>
            </h1>
            <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-medium mt-3">
                Gestão Patrimonial & Leilões
            </p>
        </div>

        <div className="bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-1 shadow-2xl">
            <div className="bg-stone-950/40 rounded-[1.3rem] p-6 border border-white/5">
                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="mb-6 pb-4 border-b border-white/5 flex justify-between items-end">
                        <span className="text-stone-400 text-xs font-medium">Credenciais de Acesso</span>
                        {isSignUp && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-wider font-bold">Novo Cadastro</span>}
                    </div>

                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider pl-1 group-focus-within:text-accent transition-colors">E-mail</label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-4 w-4 h-4 text-stone-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-stone-900/50 border border-stone-800 text-stone-200 text-sm rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-accent/50 focus:bg-stone-900 transition-all placeholder:text-stone-700 font-medium"
                                placeholder="usuario@lotecerto.com"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider pl-1 group-focus-within:text-accent transition-colors">Senha</label>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-4 w-4 h-4 text-stone-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-stone-900/50 border border-stone-800 text-stone-200 text-sm rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-accent/50 focus:bg-stone-900 transition-all placeholder:text-stone-700 font-medium"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                            <p className="text-red-200 text-xs font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                    
                    {successMsg && (
                         <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                            <p className="text-green-200 text-xs font-medium leading-relaxed">{successMsg}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-stone-200 to-white hover:from-white hover:to-white text-stone-950 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-white/5 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    {isSignUp ? 'Criar Conta' : 'Acessar Painel'}
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-accent" strokeWidth={3} />
                                </>
                            )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    </button>
                </form>

                <div className="mt-6 text-center">
                     <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }}
                        className="text-stone-500 text-xs hover:text-white transition-colors font-medium"
                    >
                        {isSignUp ? (
                            <span>Já tem acesso? <span className="text-accent underline decoration-accent/30 underline-offset-4">Entrar</span></span>
                        ) : (
                            <span>Não possui conta? <span className="text-accent underline decoration-accent/30 underline-offset-4">Solicitar Cadastro</span></span>
                        )}
                    </button>
                </div>
            </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6 opacity-30">
            <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-stone-400" />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Dados Criptografados</span>
            </div>
        </div>

      </div>
    </div>
  );
};