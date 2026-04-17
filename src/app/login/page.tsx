"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowRight, ShieldCheck, Mail, KeyRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        setIsLoading(true);

        // Simulate network API call
        setTimeout(() => {
            if (password !== "admin") {
                setError("Invalid credentials. Please attempt again or contact your administrator.");
                setIsLoading(false);
            } else {
                localStorage.setItem("salespilot_token", "demo-token");
                window.location.href = "/";
            }
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Background Architecture */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-ai-accent/5 blur-[100px]" />
                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="w-full max-w-md z-10">
                {/* Branding */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 relative">
                            <div className="absolute inset-0 border border-white/20 rounded-xl"></div>
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">
                            SalesPilot<span className="text-primary">.</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                        Smart Sales. Smarter Decisions.
                    </p>
                </div>

                {/* Login Card */}
                <div className="card-premium backdrop-blur-xl bg-white/90 p-8 shadow-2xl border-border-subtle relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150 fill-mode-both">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-ai-accent"></div>
                    
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-slate-500 font-medium">Sign in to orchestrate your deals.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 ml-1">Work Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                                    placeholder="agent@salespilot.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-slate-700">Password</label>
                                <button type="button" className="text-xs font-bold text-primary hover:text-primary-600 transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in slide-in-from-top-2 fade-in duration-300">
                                <ShieldCheck size={18} className="text-red-500 mt-0.5 shrink-0" />
                                <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-slate-900/10 active:scale-[0.98]",
                                    isLoading ? "opacity-80 cursor-not-allowed" : "hover:shadow-lg hover:shadow-slate-900/20"
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-[2.5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight size={18} className="opacity-80" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-3">
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded px-2 py-1">
                            <KeyRound size={14} />
                            Sign in with SSO
                        </button>
                        
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 text-center leading-relaxed">
                            Access restricted to authorized personnel.<br />Secure sessions only.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
