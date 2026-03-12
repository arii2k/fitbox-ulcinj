"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  full_name: string;
  training_time: string | null;
  member_type: string | null;
}

interface Measurement {
  id: string;
  member_id: string;
  weight: number;
  body_fat: number;
  hips: number | null;
  shoulders: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  bmi: number | null;
  recorded_at: string;
}

export default function MeasurementsPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMember, setSelectedMember] = useState("");

  const [form, setForm] = useState({
    weight: "",
    body_fat: "",
    hips: "",
    shoulders: "",
    left_arm: "",
    right_arm: "",
    left_thigh: "",
    right_thigh: "",
  });

  const timeSlots = [
    "07:00","08:00","09:00","10:00",
    "11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00",
    "19:00","20:00","21:00"
  ];

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) return;

    const { data: membersData } = await supabase
      .from("members")
      .select("id, full_name, training_time, member_type")
      .eq("gym_id", profile.gym_id)
      .order("full_name");

    const { data: measurementsData } = await supabase
      .from("measurements")
      .select("*")
      .order("recorded_at", { ascending: false });

    setMembers(membersData ?? []);
    setMeasurements(measurementsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.full_name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesTime =
      selectedTime === "all" || m.training_time === selectedTime;

    const matchesType =
      selectedType === "all" || m.member_type === selectedType;

    return matchesSearch && matchesTime && matchesType;
  });

  const lastMeasurement = measurements.find(
    (m) => m.member_id === selectedMember
  );

  const handleAddMeasurement = async () => {
    if (!selectedMember || !form.weight) {
      alert("Select member and enter weight");
      return;
    }

    const bmiValue = Number(form.weight)
      ? Number((Number(form.weight) / 1.75 ** 2).toFixed(1))
      : null;

    const { error } = await supabase.from("measurements").insert([
      {
        member_id: selectedMember,
        weight: Number(form.weight),
        body_fat: Number(form.body_fat),
        hips: Number(form.hips),
        shoulders: Number(form.shoulders),
        left_arm: Number(form.left_arm),
        right_arm: Number(form.right_arm),
        left_thigh: Number(form.left_thigh),
        right_thigh: Number(form.right_thigh),
        bmi: bmiValue,
      },
    ]);

    if (error) {
      console.error("Measurement insert error:", error);
      alert(error.message);
      return;
    }

    setForm({
      weight: "",
      body_fat: "",
      hips: "",
      shoulders: "",
      left_arm: "",
      right_arm: "",
      left_thigh: "",
      right_thigh: "",
    });

    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Measurements</h1>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6 flex-wrap">

        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 bg-gray-900 border border-gray-700 rounded-xl w-64"
        />

        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="p-3 bg-gray-900 border border-gray-700 rounded-xl"
        >
          <option value="all">All Groups</option>
          {timeSlots.map((t) => (
            <option key={t} value={t}>
              {t} Group
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-3 bg-gray-900 border border-gray-700 rounded-xl"
        >
          <option value="all">All Types</option>
          <option value="group">Group</option>
          <option value="personal">Personal Training</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-10">

        {/* MEMBER LIST */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
          <h2 className="text-xl font-semibold">Select Member</h2>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m.id)}
                className={`p-3 rounded-xl cursor-pointer transition ${
                  selectedMember === m.id
                    ? "bg-blue-600/30 border border-blue-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <div className="font-medium">{m.full_name}</div>
                <div className="text-xs text-gray-400">
                  {m.training_time || "No time"} • {m.member_type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-3">

          <h2 className="text-xl font-semibold">Add Measurement</h2>

          {selectedMember && lastMeasurement && (
            <div className="bg-gray-800 p-4 rounded-lg mb-4 text-sm">

              <h3 className="text-gray-300 mb-2 font-semibold">
                Last Measurement
              </h3>

              <div className="grid grid-cols-2 gap-2 text-gray-400">
                <div>Weight: {lastMeasurement.weight ?? "-"} kg</div>
                <div>Body Fat: {lastMeasurement.body_fat ?? "-"}%</div>
                <div>Hips: {lastMeasurement.hips ?? "-"}</div>
                <div>Shoulders: {lastMeasurement.shoulders ?? "-"}</div>
                <div>Left Arm: {lastMeasurement.left_arm ?? "-"}</div>
                <div>Right Arm: {lastMeasurement.right_arm ?? "-"}</div>
                <div>Left Thigh: {lastMeasurement.left_thigh ?? "-"}</div>
                <div>Right Thigh: {lastMeasurement.right_thigh ?? "-"}</div>
              </div>

            </div>
          )}

          {Object.keys(form).map((key) => (
            <input
              key={key}
              type="number"
              placeholder={key.replace("_", " ").toUpperCase()}
              value={(form as any)[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: e.target.value })
              }
              className="w-full p-3 bg-gray-800 rounded"
            />
          ))}

          <button
            onClick={handleAddMeasurement}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded w-full mt-4"
          >
            Save Measurement
          </button>

        </div>
      </div>
    </div>
  );
}