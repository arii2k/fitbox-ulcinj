"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function MemberProfilePage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;

  const [member, setMember] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    const { data: measurementData } = await supabase
      .from("measurements")
      .select("*")
      .eq("member_id", memberId)
      .order("recorded_at", { ascending: false });

    const { data: sessionData } = await supabase
      .from("training_sessions")
      .select("*")
      .order("start_time");

    setMember(memberData);
    setMeasurements(measurementData ?? []);
    setSessions(sessionData ?? []);
    setLoading(false);
  };

  const handleUpdate = async () => {
    await supabase
      .from("members")
      .update({
        full_name: member.full_name,
        phone: member.phone,
        email: member.email,
        member_type: member.member_type,
        status: member.status,
        session_id: member.session_id
      })
      .eq("id", memberId);

    alert("Member updated successfully");
  };

  if (loading) return <div>Loading...</div>;
  if (!member) return <div>Member not found</div>;

  const latest = measurements[0];
  const previous = measurements[1];

  const calculateDiff = (field: string) => {
    if (!latest || !previous) return null;
    if (latest[field] == null || previous[field] == null) return null;
    return latest[field] - previous[field];
  };

  return (
    <div className="space-y-10">

      <h1 className="text-3xl font-bold">
        {member.full_name}
      </h1>

      {/* EDIT MEMBER */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
        <h2 className="text-xl font-semibold">Edit Member</h2>

        <input
          value={member.full_name || ""}
          onChange={(e) =>
            setMember({ ...member, full_name: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
          placeholder="Full Name"
        />

        <input
          value={member.phone || ""}
          onChange={(e) =>
            setMember({ ...member, phone: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
          placeholder="Phone"
        />

        <input
          value={member.email || ""}
          onChange={(e) =>
            setMember({ ...member, email: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
          placeholder="Email"
        />

        <select
          value={member.member_type || "group"}
          onChange={(e) =>
            setMember({ ...member, member_type: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
        >
          <option value="group">Group</option>
          <option value="personal">Personal Training</option>
        </select>

        {/* REAL GROUP SESSION DROPDOWN */}
        <select
          value={member.session_id || ""}
          onChange={(e) =>
            setMember({ ...member, session_id: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
        >
          <option value="">No Group Assigned</option>

          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name} — {session.day_of_week} {session.start_time} - {session.end_time}
            </option>
          ))}
        </select>

        <select
          value={member.status || "active"}
          onChange={(e) =>
            setMember({ ...member, status: e.target.value })
          }
          className="w-full p-3 bg-gray-800 rounded"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded w-full"
        >
          Save Changes
        </button>
      </div>

      {/* PROGRESS SECTION */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">
          Progress (Last vs Previous)
        </h2>

        {latest && previous ? (
          <div className="space-y-3">
            <ProgressRow label="Weight (kg)" diff={calculateDiff("weight")} />
            <ProgressRow label="Body Fat (%)" diff={calculateDiff("body_fat")} />
            <ProgressRow label="Hips (cm)" diff={calculateDiff("hips")} />
            <ProgressRow label="Shoulders (cm)" diff={calculateDiff("shoulders")} />
            <ProgressRow label="Left Arm (cm)" diff={calculateDiff("left_arm")} />
            <ProgressRow label="Right Arm (cm)" diff={calculateDiff("right_arm")} />
            <ProgressRow label="Left Thigh (cm)" diff={calculateDiff("left_thigh")} />
            <ProgressRow label="Right Thigh (cm)" diff={calculateDiff("right_thigh")} />
          </div>
        ) : (
          <p className="text-gray-400">
            Not enough measurements to calculate progress.
          </p>
        )}
      </div>
      {/* MEASUREMENT HISTORY */}
<div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
  <h2 className="text-xl font-semibold mb-4">
    Measurement History
  </h2>

  <table className="w-full text-sm">
    <thead className="bg-gray-800">
      <tr>
        <th className="p-3 text-left">Date</th>
        <th className="p-3 text-left">Weight</th>
        <th className="p-3 text-left">Body Fat</th>
        <th className="p-3 text-left">Hips</th>
        <th className="p-3 text-left">Shoulders</th>
      </tr>
    </thead>

   <tbody>
  {measurements.length === 0 ? (
    <tr>
      <td colSpan={5} className="p-4 text-center text-gray-400">
        No measurements recorded yet.
      </td>
    </tr>
  ) : (
    measurements.map((m) => (
      <tr key={m.id} className="border-t border-gray-800">
        <td className="p-3">
          {new Date(m.recorded_at).toLocaleDateString()}
        </td>
        <td className="p-3">{m.weight ?? "-"}</td>
        <td className="p-3">{m.body_fat ?? "-"}</td>
        <td className="p-3">{m.hips ?? "-"}</td>
        <td className="p-3">{m.shoulders ?? "-"}</td>
      </tr>
    ))
  )}
</tbody>
  </table>
</div>
    </div>
  );
}

function ProgressRow({ label, diff }: any) {
  if (diff === null) return null;

  const positive = diff > 0;
  const negative = diff < 0;

  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span
        className={
          positive
            ? "text-green-400"
            : negative
            ? "text-red-400"
            : "text-gray-400"
        }
      >
        {diff > 0 ? "+" : ""}
        {diff}
      </span>
    </div>
  );
}