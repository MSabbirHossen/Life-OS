import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-bg relative overflow-hidden">
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-theme rounded-3xl p-7 sm:p-9 card-shadow relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            {isLogin ? 'Welcome back to Life OS' : 'Create your Account'}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1.5 font-medium">
            {isLogin ? 'Sign in to access your personal dashboard' : 'Start tracking your daily life with clarity'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-subtle p-1 rounded-xl border border-theme mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin
                ? 'bg-surface text-primary card-shadow'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin
                ? 'bg-surface text-primary card-shadow'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-[var(--color-danger)] font-semibold animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full font-bold shadow-md shadow-indigo-500/20"
            >
              {isLogin ? 'Sign In to Life OS' : 'Get Started'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
