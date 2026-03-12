"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface Role {
  id: string;
  name: string;
  can_manage_members: boolean;
  can_manage_payments: boolean;
  can_manage_plans: boolean;
  can_manage_trainers: boolean;
  can_manage_expenses: boolean;
  can_view_reports: boolean;
}

export default function RolesPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymId, setGymId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
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

    const { data } = await supabase
      .from("roles")
      .select("*")
      .eq("gym_id", profile.gym_id)
      .order("created_at", { ascending: false });

    setRoles((data ?? []) as Role[]);
    setLoading(false);
  };

  const handleCreateRole = async () => {
    if (!name.trim() || !gymId) return;

    await supabase.from("roles").insert([
      {
        gym_id: gymId,
        name,
        can_manage_members: false,
        can_manage_payments: false,
        can_manage_plans: false,
        can_manage_trainers: false,
        can_manage_expenses: false,
        can_view_reports: false,
      },
    ]);

    setName("");
    loadRoles();
  };

  const togglePermission = async (
    roleId: string,
    field: keyof Role,
    value: boolean
  ) => {
    // Prevent editing Owner
    const role = roles.find((r) => r.id === roleId);
    if (role?.name.toLowerCase() === "owner") return;

    await supabase
      .from("roles")
      .update({ [field]: !value })
      .eq("id", roleId);

    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, [field]: !value } : r
      )
    );
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading roles...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Roles & Permissions
      </h1>

      {/* CREATE ROLE */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl flex gap-4">
        <input
          type="text"
          placeholder="New Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700"
        />

        <button
          onClick={handleCreateRole}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
        >
          Create
        </button>
      </div>

      {/* ROLES TABLE */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-center">Members</th>
              <th className="p-4 text-center">Payments</th>
              <th className="p-4 text-center">Plans</th>
              <th className="p-4 text-center">Trainers</th>
              <th className="p-4 text-center">Expenses</th>
              <th className="p-4 text-center">Reports</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <motion.tr
                key={role.id}
                whileHover={{ backgroundColor: "#1f2937" }}
                className="border-t border-gray-800"
              >
                <td className="p-4 font-semibold flex items-center gap-2">
                  <ShieldCheck className="text-blue-400 w-4 h-4" />
                  {role.name}
                </td>

                {([
                  "can_manage_members",
                  "can_manage_payments",
                  "can_manage_plans",
                  "can_manage_trainers",
                  "can_manage_expenses",
                  "can_view_reports",
                ] as (keyof Role)[]).map((field) => (
                  <td key={field} className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={role[field] as boolean}
                      disabled={role.name.toLowerCase() === "owner"}
                      onChange={() =>
                        togglePermission(
                          role.id,
                          field,
                          role[field] as boolean
                        )
                      }
                      className="w-4 h-4 accent-blue-500"
                    />
                  </td>
                ))}
              </motion.tr>
            ))}

            {roles.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No roles created.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}