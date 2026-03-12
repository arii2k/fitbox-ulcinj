"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Gym {
  id: string;
  name: string;
  owner_email: string;
  is_active: boolean;
}

export default function SuperAdminPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGyms = async () => {
    const { data } = await supabase
      .from("gyms")
      .select("*")
      .order("created_at", { ascending: false });

    setGyms(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadGyms();
  }, []);

  const toggleGymStatus = async (id: string, current: boolean) => {
    await supabase
      .from("gyms")
      .update({ is_active: !current })
      .eq("id", id);

    loadGyms();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-10">
        SUPER ADMIN PANEL
      </h1>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Gym Name</th>
              <th className="p-4">Owner Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {gyms.map((gym) => (
              <tr key={gym.id} className="border-t border-gray-800">
                <td className="p-4 font-semibold">
                  {gym.name}
                </td>
                <td className="p-4">{gym.owner_email}</td>
                <td className="p-4">
                  {gym.is_active ? (
                    <span className="text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-red-500">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      toggleGymStatus(
                        gym.id,
                        gym.is_active
                      )
                    }
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
                  >
                    {gym.is_active
                      ? "Suspend"
                      : "Activate"}
                  </button>
                </td>
              </tr>
            ))}

            {gyms.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-400"
                >
                  No gyms registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}