"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

interface MonthData {
  month: string;
  revenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);

  const profit = revenue - expenses;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("gym_id")
        .eq("id", authData.user.id)
        .single();

      if (!profile?.gym_id) return;

      const gymId = profile.gym_id;

      // MEMBERS (WITH STATUS LOGIC)
const { data: members } = await supabase
  .from("members")
  .select("id, membership_end, status")
  .eq("gym_id", gymId);

const today = new Date();
const threeDaysLater = new Date();
threeDaysLater.setDate(today.getDate() + 3);

let total = 0;
let active = 0;
let expired = 0;
let expiring = 0;

members?.forEach((m: any) => {
  total++;

  if (!m.membership_end) return;

  const endDate = new Date(m.membership_end);

  if (endDate < today) {
    expired++;
  } else {
    active++;

    if (endDate <= threeDaysLater) {
      expiring++;
    }
  }
});

setTotalMembers(total);
setActiveMembers(active);
setExpiredMembers(expired);
setExpiringSoon(expiring);

      setTotalMembers(members?.length || 0);

      // PAYMENTS
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at")
        .eq("gym_id", gymId)
        .eq("status", "completed");

      const totalRevenue =
        payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setRevenue(totalRevenue);

      // EXPENSES
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("gym_id", gymId);

      const totalExpenses =
        expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setExpenses(totalExpenses);

      // MONTHLY CHART (current year only)
      const monthMap: Record<number, number> = {};

      payments?.forEach((p) => {
        const date = new Date(p.created_at);
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth();
          monthMap[monthIndex] =
            (monthMap[monthIndex] || 0) + Number(p.amount);
        }
      });

      const chart = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleString("default", {
          month: "short",
        }),
        revenue: monthMap[i] || 0,
      }));

      setChartData(chart);

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-400 text-center mt-20">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-10">

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
      >
        Performance Center
      </motion.h1>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">

        <Card icon={<Users />} title="Total Members" value={totalMembers} />

<Card icon={<Users />} title="Active Members" value={activeMembers} />

<Card
  icon={<Users />}
  title="Expired"
  value={expiredMembers}
  negative={expiredMembers > 0}
/>

<Card
  icon={<Users />}
  title="Expiring (3 Days)"
  value={expiringSoon}
  negative={expiringSoon > 0}
/>

<Card icon={<DollarSign />} title="Revenue" value={revenue} euro />

<Card
  icon={<TrendingUp />}
  title="Profit"
  value={profit}
  euro
  negative={profit < 0}
/>

      </div>

      {/* CHART + AI INSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-cyan-900/10 backdrop-blur-xl border border-blue-800/40 p-8 rounded-3xl shadow-2xl"
        >
          <h2 className="text-xl font-semibold mb-6">
            Revenue Trend ({currentYear})
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <XAxis dataKey="month" stroke="#aaa" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="#3b82f633"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-xl border border-purple-700/30 p-8 rounded-3xl shadow-xl"
        >
          <h2 className="text-xl font-semibold mb-4">
            AI Insight
          </h2>

          <p className="text-gray-300 leading-relaxed">
            {profit >= 0 ? (
              <>
                Your gym is generating
                <span className="text-green-400 font-bold"> €{profit} </span>
                net profit. Consider scaling marketing or introducing premium services.
              </>
            ) : (
              <>
                Your expenses currently exceed revenue by
                <span className="text-red-400 font-bold"> €{Math.abs(profit)} </span>.
                Consider reviewing operational costs or improving member retention.
              </>
            )}
          </p>
        </motion.div>

      </div>

      {/* ACTIVITY */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-3xl shadow-xl"
      >
        <h2 className="text-xl font-semibold mb-6">
          Recent Activity
        </h2>

        <div className="space-y-4 text-gray-400">
          <p>• New member registered</p>
          <p>• Payment recorded</p>
          <p>• Expense added</p>
          <p>• Membership expiring soon</p>
        </div>
      </motion.div>

    </div>
  );
}

function Card({
  icon,
  title,
  value,
  euro,
  negative,
}: {
  icon: any;
  title: string;
  value: number;
  euro?: boolean;
  negative?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl"
    >
      <div className="mb-4 text-blue-400">
        {icon}
      </div>

      <p className="text-gray-400 text-sm">{title}</p>

      <h2
        className={`text-3xl font-bold mt-2 ${
          negative ? "text-red-400" : "text-green-400"
        }`}
      >
        {euro && "€"}
        <CountUp end={value} duration={1.5} />
      </h2>
    </motion.div>
  );
}