"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-black/80"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          FITBOX <span className="text-blue-500">ADMIN</span>
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {isLogin ? "Staff Login Portal" : "Create Staff Account"}
        </p>

        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 transition"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-white"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Create Account"}
        </button>

        <p
          className="mt-5 text-center text-sm text-gray-400 cursor-pointer hover:text-white transition"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Create one"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}
