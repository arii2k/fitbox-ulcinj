"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Euro } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [gymId, setGymId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) {
      setLoading(false);
      return;
    }

    setGymId(profile.gym_id);

    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("gym_id", profile.gym_id);

    setPlans(data ?? []);
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setDuration("");
    setPrice("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSavePlan = async () => {
    if (!name || !duration || !price || !gymId) return;

    if (editingId) {
      await supabase
        .from("plans")
        .update({
          name,
          duration_days: Number(duration),
          price: Number(price),
        })
        .eq("id", editingId);
    } else {
      await supabase.from("plans").insert([
        {
          gym_id: gymId,
          name,
          duration_days: Number(duration),
          price: Number(price),
        },
      ]);
    }

    resetForm();
    loadPlans();
  };

  const handleEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setName(plan.name);
    setDuration(String(plan.duration_days));
    setPrice(String(plan.price));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("plans").delete().eq("id", id);
    loadPlans();
  };

  const avgPrice =
    plans.length > 0
      ? plans.reduce((sum, p) => sum + p.price, 0) / plans.length
      : 0;

  if (loading) {
    return <div className="text-center text-gray-400">Loading plans...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Membership Plans
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={<FileText />} label="Total Plans" value={plans.length} />
        <StatCard icon={<Euro />} label="Average Price" value={`€${avgPrice.toFixed(2)}`} />
      </div>

      {/* Button */}
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
      >
        + Add Plan
      </button>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4"
        >
          <input
            placeholder="Plan Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />
          <input
            type="number"
            placeholder="Duration (days)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />
          <input
            type="number"
            placeholder="Price (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />

          <div className="flex gap-4">
            <button
              onClick={handleSavePlan}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg"
            >
              {editingId ? "Update Plan" : "Save Plan"}
            </button>

            <button
              onClick={resetForm}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const pricePerDay = (plan.price / plan.duration_days).toFixed(2);

          return (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl"
            >
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>

              <p className="text-gray-400 text-sm">
                {plan.duration_days} days
              </p>

              <p className="text-3xl font-bold text-green-400 mt-4">
                €{plan.price}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                €{pricePerDay} per day
              </p>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleEdit(plan)}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: any;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="mb-3 text-blue-400">{icon}</div>
      <p className="text-gray-400 text-sm">{label}</p>
      <h2 className="text-3xl font-bold text-white mt-2">
        {value}
      </h2>
    </div>
  );
}