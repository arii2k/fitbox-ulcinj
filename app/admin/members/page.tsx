"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, UserCheck, AlertTriangle, UserX } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  expiry_date: string | null;
}

export default function MembersPage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expSoonCount, setExpSoonCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "active" | "soon" | "expired">("all");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
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
      .from("members")
      .select(`
        id,
        full_name,
        phone,
        email,
        membership_end,
        status
      `)
      .eq("gym_id", profile.gym_id);

const formatted = (data ?? []).map((member: any) => ({
  id: member.id,
  full_name: member.full_name,
  phone: member.phone,
  email: member.email,
  expiry_date: member.membership_end,
}));

    calculateStats(formatted);

    setMembers(
  formatted.sort((a, b) => {
    const aDate = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
    const bDate = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
    return aDate - bDate;
  })
);
    setLoading(false);
  };

  const calculateStats = (list: Member[]) => {
    const today = new Date();
    let active = 0;
    let expired = 0;
    let soon = 0;

    list.forEach((m) => {
      if (!m.expiry_date) return expired++;

      const diff =
        (new Date(m.expiry_date).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff > 7) active++;
      else if (diff > 0) soon++;
      else expired++;
    });

    setActiveCount(active);
    setExpiredCount(expired);
    setExpSoonCount(soon);
  };

  const handleAddMember = async () => {
    if (!fullName || !gymId) return;

    await supabase.from("members").insert([
      {
        gym_id: gymId,
        full_name: fullName,
        phone,
        email,
      },
    ]);

    setFullName("");
    setPhone("");
    setEmail("");
    setShowForm(false);

    loadMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await supabase.from("members").delete().eq("id", id);
    loadMembers();
  };

  const getStatus = (expiry: string | null) => {
  if (!expiry)
    return { label: "No Plan", color: "text-gray-400" };

  const today = new Date();
  const endDate = new Date(expiry);

  const diff =
    (endDate.getTime() - today.getTime()) /
    (1000 * 60 * 60 * 24);

  if (diff < 0)
    return { label: "Expired", color: "text-red-400" };

  if (diff <= 3)
    return { label: "Expiring Soon", color: "text-yellow-400" };

  return { label: "Active", color: "text-green-400" };
};

  const filtered = members
  .filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  )
  .filter((m) => {
    if (filter === "all") return true;

    const today = new Date();
    if (!m.expiry_date) return filter === "expired";

    const diff =
      (new Date(m.expiry_date).getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    if (filter === "active") return diff > 3;
    if (filter === "soon") return diff > 0 && diff <= 3;
    if (filter === "expired") return diff <= 0;

    return true;
  });

  if (loading)
    return (
      <div className="text-center text-gray-400">
        Loading members...
      </div>
    );

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Members Management
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

  <div onClick={() => setFilter("all")} className="cursor-pointer">
    <StatCard icon={<Users />} label="Total" value={members.length} />
  </div>

  <div onClick={() => setFilter("active")} className="cursor-pointer">
    <StatCard icon={<UserCheck />} label="Active" value={activeCount} green />
  </div>

  <div onClick={() => setFilter("soon")} className="cursor-pointer">
    <StatCard icon={<AlertTriangle />} label="Expiring" value={expSoonCount} yellow />
  </div>

  <div onClick={() => setFilter("expired")} className="cursor-pointer">
    <StatCard icon={<UserX />} label="Expired" value={expiredCount} red />
  </div>

</div>

      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3 p-3 bg-gray-900 border border-gray-800 rounded-xl"
        />

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
        >
          + Add Member
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4"
        >
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg"
          />
          <button
            onClick={handleAddMember}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full"
          >
            Save Member
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((m) => {
              const status = getStatus(m.expiry_date);
              return (
                <tr key={m.id} className="border-t border-gray-800">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.phone}</td>
                  <td className="p-4">{m.email}</td>
                  <td className={`p-4 font-semibold ${status.color}`}>
                    {status.label}
                  </td>
                  <td className="p-4 flex gap-4">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  green,
  yellow,
  red,
}: {
  icon: any;
  label: string;
  value: number;
  green?: boolean;
  yellow?: boolean;
  red?: boolean;
}) {
  const color = green
    ? "text-green-400"
    : yellow
    ? "text-yellow-400"
    : red
    ? "text-red-400"
    : "text-blue-400";

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="mb-4">{icon}</div>
      <p className="text-gray-400 text-sm">{label}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </h2>
    </div>
  );
}