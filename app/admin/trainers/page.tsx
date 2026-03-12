"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Percent } from "lucide-react";

interface Trainer {
  id: string;
  full_name: string;
  email: string;
  commission_percentage: number;
}

export default function TrainersPage() {
  const router = useRouter();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commission, setCommission] = useState("0");

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      router.push("/login");
      return;
    }

    const user = authData.user;

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, commission_percentage")
      .eq("gym_id", profile.gym_id)
      .eq("role", "trainer");

    const safeTrainers: Trainer[] = (data ?? []).map((item: any) => ({
      id: item.id,
      full_name: item.full_name,
      email: item.email,
      commission_percentage: item.commission_percentage,
    }));

    setTrainers(safeTrainers);
    setLoading(false);
  };

  const handleAddTrainer = async () => {
    if (!name || !email) {
      alert("Name and email required");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", authData.user.id)
      .single();

    if (!profile?.gym_id) return;

    const { data: subscription } = await supabase
      .from("gym_subscriptions")
      .select("seat_limit, status")
      .eq("gym_id", profile.gym_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription || subscription.status !== "active") {
      alert("No active subscription.");
      return;
    }

    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", profile.gym_id)
      .neq("role", "owner");

    if ((count ?? 0) >= subscription.seat_limit) {
      alert("Seat limit reached. Please upgrade your plan.");
      return;
    }

   const { error } = await supabase.from("users").insert([
  {
    gym_id: profile.gym_id,
    full_name: name,
    email,
    role: "trainer",
    commission_percentage: Number(commission),
  },
]);

if (error) {
  console.error(error);
  alert(error.message);
  return;
}

    setName("");
    setEmail("");
    setCommission("0");

    loadTrainers();
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Delete this trainer?");
    if (!confirmDelete) return;

    await supabase.from("users").delete().eq("id", id);

    loadTrainers();
  };

  const handleEdit = async (trainer: Trainer) => {
    const newName = prompt("Trainer name", trainer.full_name);
    const newCommission = prompt(
      "Commission %",
      String(trainer.commission_percentage)
    );

    if (!newName || !newCommission) return;

    await supabase
      .from("users")
      .update({
        full_name: newName,
        commission_percentage: Number(newCommission),
      })
      .eq("id", trainer.id);

    loadTrainers();
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Trainer Management
      </h1>

      <StatCard
        icon={<Users />}
        label="Total Trainers"
        value={trainers.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users size={18} /> Add Trainer
          </h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

          <div className="relative">
            <input
              type="number"
              placeholder="Commission %"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 pr-10"
            />
            <Percent
              size={16}
              className="absolute right-3 top-4 text-gray-400"
            />
          </div>

          <button
            onClick={handleAddTrainer}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl w-full font-medium"
          >
            Save Trainer
          </button>
        </motion.div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Commission</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {trainers.map((trainer) => (
                <tr
                  key={trainer.id}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition"
                >
                  <td className="p-4 font-medium">
                    {trainer.full_name}
                  </td>

                  <td className="p-4 text-gray-400">
                    {trainer.email}
                  </td>

                  <td className="p-4 text-blue-400 font-medium">
                    {trainer.commission_percentage}%
                  </td>

                  <td className="p-4 flex gap-4">
                    <button
                      onClick={() => handleEdit(trainer)}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(trainer.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {trainers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No trainers added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>
    </div>
  );
}