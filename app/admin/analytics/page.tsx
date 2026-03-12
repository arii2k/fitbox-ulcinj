"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [newMembers, setNewMembers] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState(0);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const loadAnalytics = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const gymId = profile.gym_id;

    const months: MonthlyData[] = [];
    let sixMonthRevenue = 0;
    let sixMonthExpenses = 0;

    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("gym_id", gymId)
        .eq("status", "completed")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("gym_id", gymId)
        .gte("expense_date", start.toISOString())
        .lt("expense_date", end.toISOString());

      const revenue =
        payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const totalExp =
        expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      sixMonthRevenue += revenue;
      sixMonthExpenses += totalExp;

      months.push({
        month: start.toLocaleString("default", { month: "short" }),
        revenue,
        expenses: totalExp,
        profit: revenue - totalExp,
      });
    }

    setMonthlyData(months);
    setTotalRevenue(sixMonthRevenue);
    setTotalExpenses(sixMonthExpenses);
    setTotalProfit(sixMonthRevenue - sixMonthExpenses);

    // NEW MEMBERS THIS MONTH
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: members } = await supabase
      .from("members")
      .select("id")
      .eq("gym_id", gymId)
      .gte("created_at", startOfMonth.toISOString());

    setNewMembers(members?.length || 0);

    // ATTENDANCE TODAY (FIXED gym_id filter)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: attendance } = await supabase
      .from("attendance")
      .select("id")
      .eq("gym_id", gymId)
      .gte("check_in", todayStart.toISOString());

    setAttendanceToday(attendance?.length || 0);

    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          Business Analytics
        </h1>
        <button
          onClick={loadAnalytics}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="New Members This Month"
          value={newMembers}
          color="blue"
        />
        <StatCard
          title="Attendance Today"
          value={attendanceToday}
          color="purple"
        />
        <StatCard
          title="6 Month Net Profit"
          value={`€${totalProfit}`}
          color={totalProfit >= 0 ? "green" : "red"}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Revenue (6 Months)"
          value={`€${totalRevenue}`}
          color="green"
        />
        <StatCard
          title="Total Expenses (6 Months)"
          value={`€${totalExpenses}`}
          color="red"
        />
      </div>

      {/* TABLE */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-8 rounded-2xl border border-gray-800 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-white">
          Last 6 Months Overview
        </h2>

        {monthlyData.length === 0 ? (
          <p className="text-gray-400">No financial data yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4">Month</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Expenses</th>
                <th className="p-4">Profit</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data, index) => (
                <tr key={index} className="border-t border-gray-800">
                  <td className="p-4">{data.month}</td>
                  <td className="p-4 text-green-400 font-medium">
                    €{data.revenue}
                  </td>
                  <td className="p-4 text-red-400 font-medium">
                    €{data.expenses}
                  </td>
                  <td
                    className={`p-4 font-semibold ${
                      data.profit >= 0
                        ? "text-green-400"
                        : "text-red-500"
                    }`}
                  >
                    €{data.profit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: "green" | "red" | "blue" | "purple";
}) {
  const colorMap = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-2xl border border-gray-800 shadow-lg hover:scale-[1.02] transition-all">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className={`text-3xl font-bold mt-3 ${colorMap[color]}`}>
        {value}
      </h2>
    </div>
  );
}