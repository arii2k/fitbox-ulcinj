"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../../lib/supabase";

export default function QRCheckInPage() {

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "progress" | "reward" | "error" | ""
  >("");
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {

    audioRef.current = new Audio("/success.mp3");

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      async (decodedText) => {

        if (scanning) return;

        setScanning(true);

        await handleCheckIn(decodedText);

        setTimeout(() => setScanning(false), 3000);

      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, [scanning]);



  const handleCheckIn = async (memberId: string) => {

    setMessage("");
    setMessageType("");
    setProgress(0);

    try {

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);


      // WEEKLY LIMIT (max 3 per week)
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .gte("check_in", weekStart.toISOString());

      if (weeklyError) {
        setMessage("Error checking weekly limit ❌");
        setMessageType("error");
        return;
      }

      if ((weeklyCount ?? 0) >= 3) {
        setMessage("Weekly limit reached (max 3 visits) ❌");
        setMessageType("error");
        return;
      }


      // INSERT CHECK-IN
      const { error: insertError } = await supabase
        .from("attendance")
        .insert([
          {
            member_id: memberId,
            check_in: new Date().toISOString(),
          },
        ]);

      if (insertError) {

        if (insertError.message.includes("unique_daily_checkin")) {
          setMessage("Already checked in today ❌");
          setMessageType("error");
          return;
        }

        setMessage("Check-in failed ❌");
        setMessageType("error");
        return;
      }


      // COUNT LAST 30 DAYS
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: visits30Days } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .gte("check_in", thirtyDaysAgo.toISOString());

      const visits = visits30Days ?? 0;
      const percentage = Math.min((visits / 10) * 100, 100);

      setProgress(percentage);


      // SUCCESS SOUND
      audioRef.current?.play().catch(() => {});


      // LOYALTY LOGIC
      if (visits === 10) {

        setMessage(
          `🎉 FREE PROTEIN SHAKE UNLOCKED! Ask at reception.`
        );
        setMessageType("reward");

        // CONFETTI (NO TYPESCRIPT ERRORS VERSION)
        const confetti = require("canvas-confetti");

        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });

      } else if (visits < 10) {

        const remaining = 10 - visits;

        setMessage(
          `💪 ${visits}/10 visits completed. Only ${remaining} more to earn a FREE protein shake!`
        );
        setMessageType("progress");

      } else {

        setMessage(
          `🔥 ${visits}/10 visits this month. Keep pushing!`
        );
        setMessageType("success");
      }

    } catch (err) {

      console.error(err);
      setMessage("Unexpected error ❌");
      setMessageType("error");

    }

  };



  const getMessageColor = () => {

    if (messageType === "reward") return "text-yellow-400";
    if (messageType === "progress") return "text-blue-400";
    if (messageType === "success") return "text-green-400";
    if (messageType === "error") return "text-red-400";

    return "text-white";
  };



  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">

      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center shadow-2xl">

        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          QR Check-In Scanner
        </h1>

        <div id="reader" className="mb-6 rounded-xl overflow-hidden" />

        {progress > 0 && (
          <div className="w-full bg-gray-800 rounded-full h-4 mb-6 overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {message && (
          <p className={`mt-4 text-lg font-semibold ${getMessageColor()}`}>
            {message}
          </p>
        )}

      </div>

    </div>

  );

}