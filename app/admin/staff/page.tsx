"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role_id: string | null;
  roles?: {
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  permissions: any;
}

const permissionList: any = {
  members_view: "View Members",
  members_edit: "Edit Members",
  payments_manage: "Manage Payments",
  staff_manage: "Manage Staff",
  analytics_view: "View Analytics",
  expenses_manage: "Manage Expenses",
};

const defaultRoles = [
  {
    name: "Owner",
    permissions: {
      members_view: true,
      members_edit: true,
      payments_manage: true,
      staff_manage: true,
      analytics_view: true,
      expenses_manage: true,
    },
  },
  {
    name: "Trainer",
    permissions: {
      members_view: true,
      members_edit: true,
    },
  },
  {
    name: "Receptionist",
    permissions: {
      members_view: true,
      members_edit: true,
      payments_manage: true,
    },
  },
];

export default function StaffPage() {

  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [roleSelection, setRoleSelection] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const ensureDefaultRoles = async (gymId: string) => {

    for (const role of defaultRoles) {

      const { data } = await supabase
        .from("roles")
        .select("id")
        .eq("gym_id", gymId)
        .eq("name", role.name)
        .maybeSingle();

      if (!data) {

        await supabase.from("roles").insert([
          {
            gym_id: gymId,
            name: role.name,
            permissions: role.permissions
          }
        ]);

      }

    }

  };

  const loadData = async () => {

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

    if (!profile?.gym_id) return;

    setGymId(profile.gym_id);

    await ensureDefaultRoles(profile.gym_id);

    const { data: rolesData } = await supabase
      .from("roles")
      .select("*")
      .eq("gym_id", profile.gym_id);

      const { data: staffData } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role_id,
        roles(name)
      `)
      .eq("gym_id", profile.gym_id);

    setRoles(rolesData || []);
    setStaff((staffData ?? []) as any);

    setLoading(false);

  };

  const togglePermission = (key: string) => {

    setPermissions((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));

  };

  const getRoleId = async () => {

    if (!gymId) return null;

    let roleName = roleSelection;

    if (roleSelection === "custom") {
      roleName = customRole.trim();
    }

    if (!roleName || roleName.length < 2) return null;

    const { data: existing } = await supabase
      .from("roles")
      .select("*")
      .eq("gym_id", gymId)
      .eq("name", roleName)
      .maybeSingle();

    if (existing) return existing.id;

      const { data, error } = await supabase
      .from("roles")
      .insert([
        {
          gym_id: gymId,
          name: roleName,
          permissions: permissions || {}
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    // IMPORTANT: add new role into state immediately
    setRoles(prev => [...prev, data]);

return data.id;
  };

  const handleAddStaff = async () => {

    if (!name || !email || !gymId) return;

    if (roleSelection === "custom" && !customRole.trim()) {
      alert("Please enter a custom role name.");
      return;
    }

    const roleId = await getRoleId();

    const { error } = await supabase
      .from("users")
      .insert([
        {
          id: crypto.randomUUID(),
          gym_id: gymId,
          full_name: name,
          email: email,
          role_id: roleId
        }
      ]);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setName("");
    setEmail("");
    setRoleSelection("");
    setCustomRole("");
    setPermissions({});
    setShowForm(false);

    await loadData();

  };

  const handleDeleteStaff = async (id: string) => {

    if (!confirm("Remove staff member?")) return;

    await supabase.from("users").delete().eq("id", id);

    setStaff((prev) => prev.filter((s) => s.id !== id));

  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (

    <div className="space-y-10">

      <div className="flex justify-between items-center">

        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Staff Management
        </h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 px-6 py-3 rounded-xl flex gap-2"
        >
          <Plus size={18}/> Add Staff
        </button>

      </div>

      {showForm && (

      <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        className="bg-gray-900 p-6 rounded-xl space-y-4"
      >

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded"
        />

        <select
          value={roleSelection}
          onChange={(e)=>{
            setRoleSelection(e.target.value);
            setPermissions({});
          }}
          className="w-full p-3 bg-gray-800 rounded"
        >

          <option value="">Select Role</option>
          <option value="Owner">Owner</option>
          <option value="Trainer">Trainer</option>
          <option value="Receptionist">Receptionist</option>
          <option value="custom">Custom Role (Create New)</option>

        </select>

        {roleSelection === "custom" && (

        <>
          <input
            placeholder="Role Name (Manager, Nutritionist...)"
            value={customRole}
            onChange={(e)=>setCustomRole(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded"
          />

          <div className="grid grid-cols-2 gap-3">

            {Object.entries(permissionList).map(([key, label]) => (
              <label key={key} className="flex gap-2 items-center">

                <input
                  type="checkbox"
                  checked={permissions[key] || false}
                  onChange={()=>togglePermission(key)}
                />

                {label as string} 

              </label>
            ))}

          </div>
        </>

        )}

        <button
          onClick={handleAddStaff}
          className="bg-green-600 w-full py-3 rounded"
        >
          Create Staff Member
        </button>

      </motion.div>

      )}

      <div className="bg-gray-900 rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-800">

            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-center">Actions</th>
            </tr>

          </thead>

                    <tbody>
              {staff.map(user => {

                const roleName =
                  roles.find(r => r.id === user.role_id)?.name ?? "-";

                return (

                  <tr key={user.id} className="border-t border-gray-800">

                    <td className="p-4">{user.full_name}</td>
                    <td className="p-4 text-gray-400">{user.email}</td>
                    <td className="p-4">{roleName}</td>

                    <td className="p-4 text-center">
                      <button
                        onClick={()=>handleDeleteStaff(user.id)}
                        className="text-red-400"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>

                  </tr>

                )

              })}
            </tbody>

        </table>

      </div>

    </div>

  );

}