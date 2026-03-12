"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { Search, QrCode } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
}

export default function QRPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, full_name")
        .order("full_name");

      setMembers(data ?? []);
    };

    loadMembers();
  }, []);

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          QR Generator
        </h1>
        <p className="text-gray-400 mt-3">
          Generate and print member QR codes for fast check-in.
        </p>
      </motion.div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {filtered.map((member) => (
          <motion.div
            key={member.id}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-6 shadow-xl text-center"
          >
            <div className="flex justify-center mb-4 text-blue-400">
              <QrCode />
            </div>

            <h3 className="font-semibold mb-6 text-lg">
              {member.full_name}
            </h3>

            <div className="bg-black p-4 rounded-2xl inline-block">
              <QRCode
                value={member.id}
                size={130}
                bgColor="#000000"
                fgColor="#3b82f6"
              />
            </div>

            <button
              onClick={() => setSelected(member)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-xl text-sm font-medium"
            >
              Print QR
            </button>
          </motion.div>
        ))}

      </div>

      {/* PRINT MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center shadow-2xl">

            <h2 className="text-xl font-semibold mb-6">
              {selected.full_name}
            </h2>

            <div className="bg-black p-6 rounded-2xl inline-block mb-6">
              <QRCode
                value={selected.id}
                size={200}
                bgColor="#000000"
                fgColor="#3b82f6"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl"
              >
                Print
              </button>

              <button
                onClick={() => setSelected(null)}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}