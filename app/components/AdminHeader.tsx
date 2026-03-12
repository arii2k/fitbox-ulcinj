"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminHeader({ title }: { title: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex justify-between items-center mb-10">
      <h1 className="text-3xl font-bold">{title}</h1>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}