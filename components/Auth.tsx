import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl border-4 border-black/80 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">Training Calendar</h1>
        <p className="text-center text-gray-600 mb-8">Please sign in to continue</p>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="font-bold text-gray-700" htmlFor="email">Email</label>
            <input
              id="email"
              className="w-full p-3 border-2 border-black/70 rounded-lg mt-1"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-label="Email address"
            />
          </div>
          <div>
            <label className="font-bold text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              className="w-full p-3 border-2 border-black/70 rounded-lg mt-1"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-label="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-gray-900 font-bold py-3 px-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-amber-500 active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
