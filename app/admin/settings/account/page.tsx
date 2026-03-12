"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AccountSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setUserId(data.user.id);
    setEmail(data.user.email || "");

    const { data: profile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
    }

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;

    await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (email) {
      await supabase.auth.updateUser({
        email,
      });
    }

    alert("Profile updated successfully");
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    await supabase.auth.updateUser({
      password: newPassword,
    });

    setNewPassword("");
    setConfirmPassword("");

    alert("Password updated successfully");
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading account...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Account Settings
      </h1>

      {/* PROFILE SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-6"
      >
        <h2 className="text-xl font-semibold text-white">
          Profile Information
        </h2>

        <div>
          <label className="text-gray-400 text-sm">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <button
          onClick={handleUpdateProfile}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
        >
          Save Profile
        </button>
      </motion.div>

      {/* PASSWORD SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-6"
      >
        <h2 className="text-xl font-semibold text-white">
          Change Password
        </h2>

        <div>
          <label className="text-gray-400 text-sm">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <button
          onClick={handleChangePassword}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg"
        >
          Update Password
        </button>
      </motion.div>

    </div>
  );
}