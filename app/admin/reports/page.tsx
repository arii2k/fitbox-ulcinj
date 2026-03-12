"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  expiry_date: string | null;
  created_at: string;
  members: { full_name: string } | null;
}

interface Member {
  id: string;
}

export default function ReportsPage() {
  const router = useRouter();

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMemberships, setActiveMemberships] = useState(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const profileResponse = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    const profile = profileResponse.data;
    if (!profile?.gym_id) {
      console.log("No gym_id found for user");
      setLoading(false);
      return;
    }

    const gymId = profile.gym_id;

    // MEMBERS
    const membersResponse = await supabase
      .from("members")
      .select("id")
      .eq("gym_id", gymId);

    const membersData = membersResponse.data as Member[] | null;
    setTotalMembers(membersData?.length ?? 0);

    // PAYMENTS
    const paymentsResponse = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_method,
        status,
        expiry_date,
        created_at,
        members ( full_name )
      `)
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    const paymentsData = paymentsResponse.data as Payment[] | null;

    if (paymentsData) {
      // TOTAL REVENUE
      const revenue = paymentsData
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setTotalRevenue(revenue);

      // MONTHLY REVENUE
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const monthly = paymentsData
        .filter(
          (p) =>
            p.status === "completed" &&
            new Date(p.created_at) >= startOfMonth
        )
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setMonthlyRevenue(monthly);

      // ACTIVE MEMBERSHIPS
      const active = paymentsData.filter(
        (p) =>
          p.status === "completed" &&
          p.expiry_date &&
          new Date(p.expiry_date) > new Date()
      );

      setActiveMemberships(active.length);

      // RECENT 10
      setRecentPayments(paymentsData.slice(0, 10));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-10">Reports Dashboard</h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <Card title="Total Revenue" value={`€${totalRevenue}`} />
        <Card title="Monthly Revenue" value={`€${monthlyRevenue}`} />
        <Card title="Total Members" value={totalMembers} />
        <Card title="Active Memberships" value={activeMemberships} />
      </div>

      {/* RECENT PAYMENTS */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <h2 className="p-6 text-xl font-semibold">Recent Payments</h2>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {recentPayments.map((p) => (
              <tr key={p.id} className="border-t border-gray-800">
                <td className="p-3">{p.members?.full_name}</td>
                <td className="p-3">€{p.amount}</td>
                <td className="p-3 capitalize">{p.payment_method}</td>
                <td className="p-3">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {recentPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}