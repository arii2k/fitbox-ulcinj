"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function GeneralSettingsPage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [tax, setTax] = useState("0");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.gym_id) {
      setLoading(false);
      return;
    }

    setGymId(profile.gym_id);

    const { data: gym } = await supabase
      .from("gyms")
      .select("*")
      .eq("id", profile.gym_id)
      .single();

    if (gym) {
      setName(gym.name || "");
      setEmail(gym.email || "");
      setPhone(gym.phone || "");
      setAddress(gym.address || "");
      setCurrency(gym.currency || "EUR");
      setTax(String(gym.tax_percentage || 0));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!gymId) return;

    await supabase
      .from("gyms")
      .update({
        name,
        email,
        phone,
        address,
        currency,
        tax_percentage: Number(tax),
      })
      .eq("id", gymId);

    alert("Settings updated successfully");
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        General Settings
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-6"
      >
        <div>
          <label className="text-gray-400 text-sm">Gym Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <div>
          <label className="text-gray-400 text-sm">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-gray-400 text-sm">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="ALL">ALL (Lek)</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Tax %</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
        >
          Save Changes
        </button>
      </motion.div>
    </div>
  );
}