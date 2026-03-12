"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Users } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  membership_end: string | null;
}

interface Attendance {
  id: string;
  check_in: string;
  check_out: string | null;
  members: {
    full_name: string;
  } | null;
}

export default function AttendancePage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [gymId, setGymId] = useState<string | null>(null);

  const [todayCount, setTodayCount] = useState(0);
  const [insideCount, setInsideCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

    const { data: membersData } = await supabase
  .from("members")
  .select("id, full_name, membership_end")
  .eq("gym_id", profile.gym_id);

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select(`
        id,
        check_in,
        check_out,
        members ( full_name )
      `)
      .eq("gym_id", profile.gym_id)
      .order("check_in", { ascending: false });

    const records =
      (attendanceData ?? []).map((item: any) => ({
        id: item.id,
        check_in: item.check_in,
        check_out: item.check_out,
        members: item.members,
      })) as Attendance[];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRecords = records.filter(
      (r) => new Date(r.check_in) >= todayStart
    );

    const currentlyInside = records.filter((r) => !r.check_out);

    setMembers((membersData ?? []) as Member[]);
    setAttendance(records);
    setTodayCount(todayRecords.length);
    setInsideCount(currentlyInside.length);

    setLoading(false);
  };

const handleCheckIn = async () => {
  if (!selectedMember || !gymId) return;

  const member = members.find((m) => m.id === selectedMember);

  if (!member) return;

  const today = new Date();

  if (!member.membership_end) {
    alert("This member has no active plan.");
    return;
  }

  const expiryDate = new Date(member.membership_end);

  if (expiryDate < today) {
    alert("Membership expired. Cannot check-in.");
    return;
  }

    // 🔒 PREVENT DOUBLE CHECK-IN
  const alreadyInside = attendance.find(
    (r) =>
      r.members?.full_name === member.full_name &&
      !r.check_out
  );

  if (alreadyInside) {
    alert("Member is already inside.");
    return;
  }

  await supabase.from("attendance").insert([
    {
      member_id: selectedMember,
      check_in: new Date().toISOString(),
      gym_id: gymId,
    },
  ]);

  setSelectedMember("");
  loadData();
};

  const handleCheckOut = async (id: string) => {
    await supabase
      .from("attendance")
      .update({ check_out: new Date().toISOString() })
      .eq("id", id);

    loadData();
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-10">

      {/* TITLE */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Attendance Management
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={<LogIn />} label="Check-ins Today" value={todayCount} />
        <StatCard icon={<Users />} label="Currently Inside" value={insideCount} />
      </div>

      {/* CHECK-IN CARD */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4"
      >
        <h2 className="text-xl font-semibold">Manual Check-In</h2>

        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
        >
          <option value="">Select Member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>

        <button
          onClick={handleCheckIn}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl w-full font-medium"
        >
          Check In
        </button>
      </motion.div>

      {/* TABLE */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-4 text-left">Member</th>
              <th className="p-4 text-left">Check In</th>
              <th className="p-4 text-left">Check Out</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record) => {
              const isInside = !record.check_out;

              return (
                <tr
                  key={record.id}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition"
                >
                  <td className="p-4 font-medium">
                    {record.members?.full_name}
                  </td>

                  <td className="p-4 text-gray-400">
                    {new Date(record.check_in).toLocaleString()}
                  </td>

                  <td className="p-4 text-gray-400">
                    {record.check_out
                      ? new Date(record.check_out).toLocaleString()
                      : "-"}
                  </td>

                  <td className="p-4">
                    {isInside ? (
                      <button
                        onClick={() => handleCheckOut(record.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg text-xs"
                      >
                        Check Out
                      </button>
                    ) : (
                      <span className="text-green-400 text-xs font-medium">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {attendance.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500">
                  No attendance records yet.
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
}: {
  icon: any;
  label: string;
  value: any;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl">
      <div className="mb-3 text-blue-400">{icon}</div>
      <p className="text-gray-400 text-sm">{label}</p>
      <h2 className="text-3xl font-bold text-white mt-2">
        {value}
      </h2>
    </div>
  );
}