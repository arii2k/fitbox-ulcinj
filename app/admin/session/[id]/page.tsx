"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function SessionDetailsPage() {
  const { id } = useParams();

  const [session, setSession] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    if (id) initialize();
  }, [id]);

  const initialize = async () => {
    await loadSession();
    await loadMembers();
    await loadAssignedMembers();
    setLoading(false);
  };

  const loadSession = async () => {
    const { data } = await supabase
      .from("training_sessions")
      .select("*, users(full_name)")
      .eq("id", id)
      .single();

    setSession(data);
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("id, full_name");

    setMembers(data ?? []);
  };

  const loadAssignedMembers = async () => {
    const { data } = await supabase
      .from("session_members")
      .select("id, member_id, members(full_name)")
      .eq("session_id", id);

    setAssignedMembers(data ?? []);
  };

  const addMember = async () => {
    if (!selectedMember) return;

    if (assignedMembers.length >= session.max_capacity) {
      alert("Session is full.");
      return;
    }

    await supabase.from("session_members").insert([
      {
        session_id: id,
        member_id: selectedMember,
      },
    ]);

    setSelectedMember("");
    await loadAssignedMembers();
  };

  const removeMember = async (sessionMemberId: string) => {
    await supabase
      .from("session_members")
      .delete()
      .eq("id", sessionMemberId);

    await loadAssignedMembers();
  };

  if (loading) return <div>Loading session...</div>;
  if (!session) return <div>Session not found.</div>;

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        Session Details
      </h1>

      <div className="bg-gray-900 p-6 rounded-xl space-y-3">
        <p><strong>Trainer:</strong> {session.users?.full_name}</p>
        <p><strong>Type:</strong> {session.session_type}</p>
        <p><strong>Gender:</strong> {session.gender_type}</p>
        <p><strong>Day:</strong> {session.day_of_week}</p>
        <p><strong>Start:</strong> {session.start_time}</p>
        <p><strong>End:</strong> {session.end_time}</p>
        <p><strong>Capacity:</strong> {assignedMembers.length} / {session.max_capacity}</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Assign Member</h2>

        <div className="flex gap-4">
          <select
            className="flex-1 p-2 bg-gray-800 rounded"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={addMember}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">
          Assigned Members
        </h2>

        {assignedMembers.length === 0 && (
          <p className="text-gray-400">No members assigned.</p>
        )}

        {assignedMembers.map((sm) => (
          <div
            key={sm.id}
            className="flex justify-between items-center bg-gray-800 p-3 rounded"
          >
            <span>{sm.members?.full_name}</span>

            <button
              onClick={() => removeMember(sm.id)}
              className="text-red-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}