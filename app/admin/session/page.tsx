"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const generateTimeSlots = () => {
  const times = [];
  for (let i = 6; i <= 23; i++) {
    times.push(`${i.toString().padStart(2, "0")}:00:00`);
  }
  return times;
};

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m + minutes);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:00`;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [gymId, setGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [sessionType, setSessionType] = useState("group");
  const [genderType, setGenderType] = useState("mixed");
  const [duration, setDuration] = useState(60);
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [trainerId, setTrainerId] = useState("");

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!profile?.gym_id) return;

    setGymId(profile.gym_id);

    await loadSessions(profile.gym_id);
    await loadTrainers(profile.gym_id);
  };

  const loadSessions = async (gym_id: string) => {
    const { data } = await supabase
      .from("training_sessions")
      .select("*, users(full_name)")
      .eq("gym_id", gym_id);

    setSessions(data ?? []);
    setLoading(false);
  };

  const loadTrainers = async (gym_id: string) => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("gym_id", gym_id)
      .eq("role", "trainer");

    setTrainers(data ?? []);
  };

  const getSession = (day: string, time: string) => {
    return sessions.find(
      (s) =>
        s.day_of_week === day &&
        s.start_time === time
    );
  };

  const handleCellClick = async (day: string, time: string) => {
    const existing = getSession(day, time);

    if (existing) {
      await supabase
        .from("training_sessions")
        .delete()
        .eq("id", existing.id);

      if (gymId) await loadSessions(gymId);
      return;
    }

    setSelectedDay(day);
    setSelectedTime(time);
    setShowModal(true);
  };

  const createSession = async () => {
    if (!gymId || !selectedDay || !selectedTime || !trainerId) return;

    const endTime = addMinutes(selectedTime, duration);

    await supabase.from("training_sessions").insert([
      {
        gym_id: gymId,
        name: `${sessionType} ${selectedDay} ${selectedTime.slice(0, 5)}`,
        day_of_week: selectedDay,
        start_time: selectedTime,
        end_time: endTime,
        session_type: sessionType,
        gender_type: genderType,
        trainer_id: trainerId,
        max_capacity: sessionType === "personal" ? 1 : maxCapacity,
      },
    ]);

    setShowModal(false);
    setTrainerId("");
    setSessionType("group");
    setGenderType("mixed");
    setDuration(60);
    setMaxCapacity(20);

    await loadSessions(gymId);
  };

  if (loading) return <div>Loading schedule...</div>;

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        Weekly Training Schedule
      </h1>

      <div className="overflow-auto border border-gray-800 rounded-xl">
        <table className="min-w-full text-center text-sm">

          <thead className="bg-gray-900">
            <tr>
              <th className="p-3 border border-gray-800">Time</th>
              {days.map((day) => (
                <th key={day} className="p-3 border border-gray-800">
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td className="border border-gray-800 p-2 font-medium bg-gray-900">
                  {time.slice(0, 5)}
                </td>

                {days.map((day) => {
                  const session = getSession(day, time);
                  const active = !!session;

                  return (
                    <td
                      key={day + time}
                      onClick={() => handleCellClick(day, time)}
                      className={`border border-gray-800 cursor-pointer transition text-xs ${
                        active
                          ? session.session_type === "personal"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-950 hover:bg-gray-800"
                      }`}
                    >
                      {active && (
                        <div className="p-1">
                          <div className="font-semibold">
                            {session.users?.full_name}
                          </div>
                          <div>
                            {session.session_type}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {showModal && selectedDay && selectedTime && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl w-96 space-y-4">

            <h2 className="text-xl font-bold">
              Create Session - {selectedDay} {selectedTime.slice(0,5)}
            </h2>

            <select
              className="w-full p-2 bg-gray-800 rounded"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
            >
              <option value="group">Group Training</option>
              <option value="personal">Personal Training</option>
            </select>

            <select
              className="w-full p-2 bg-gray-800 rounded"
              value={genderType}
              onChange={(e) => setGenderType(e.target.value)}
            >
              <option value="mixed">Mixed</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>

            <select
              className="w-full p-2 bg-gray-800 rounded"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>

            {sessionType === "group" && (
              <input
                type="number"
                placeholder="Max Capacity"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full p-2 bg-gray-800 rounded"
              />
            )}

            <select
              className="w-full p-2 bg-gray-800 rounded"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">Select Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={createSession}
                className="px-4 py-2 bg-blue-600 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}