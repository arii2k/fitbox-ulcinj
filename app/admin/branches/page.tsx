"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, MapPin, Phone } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at: string;
}

export default function BranchesPage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
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

    setGymId(profile.gym_id);

    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("gym_id", profile.gym_id)
      .order("created_at", { ascending: false });

    const safeBranches: Branch[] = (data ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      phone: item.phone,
      created_at: item.created_at,
    }));

    setBranches(safeBranches);
    setLoading(false);
  };

  const handleAddBranch = async () => {
    if (!name.trim() || !gymId) {
      alert("Branch name required");
      return;
    }

  const { error } = await supabase.from("branches").insert([
  {
    gym_id: gymId,
    name,
    address,
    phone,
  },
]);

if (error) {
  console.error(error);
  alert(error.message);
  return;
}

    setName("");
    setAddress("");
    setPhone("");

    loadBranches();
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Delete this branch?")) return;

    await supabase.from("branches").delete().eq("id", id);
    loadBranches();
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400">
        Loading branches...
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* TITLE */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Branch Management
      </h1>

      {/* KPI */}
      <StatCard
        icon={<Building2 />}
        label="Total Branches"
        value={branches.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ADD BRANCH */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 size={18} /> Add Branch
          </h2>

          <div className="relative">
            <input
              type="text"
              placeholder="Branch Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
            />
            <MapPin size={16} className="absolute right-3 top-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
            />
            <Phone size={16} className="absolute right-3 top-4 text-gray-400" />
          </div>

          <button
            onClick={handleAddBranch}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl w-full font-medium transition"
          >
            Save Branch
          </button>
        </motion.div>

        {/* LIST */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition"
                >
                  <td className="p-4 font-medium">
                    {branch.name}
                  </td>
                  <td className="p-4 text-gray-400">
                    {branch.address}
                  </td>
                  <td className="p-4 text-gray-400">
                    {branch.phone}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {branches.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No branches created.
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