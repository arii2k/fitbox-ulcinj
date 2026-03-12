"use client";

import { useState, useEffect } from "react";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Member {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  date_of_birth: string | null;
  gender: string | null;
  join_date: string | null;
  status: string | null;
  notes: string | null;
}

interface CsvRow {
  full_name: string;
  phone?: string;
  email?: string;
  weight?: number;
  height?: number;
  body_fat?: number;
  muscle_mass?: number;
  date_of_birth?: string;
  gender?: string;
  join_date?: string;
  status?: string;
  notes?: string;
}

export default function ImportExportPage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.gym_id) return;

    setGymId(profile.gym_id);

    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("gym_id", profile.gym_id)
      .order("full_name");

    setMembers(data ?? []);
  };

  /* ================= IMPORT ================= */

  const handleCsvImport = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: Papa.ParseResult<CsvRow>) => {
        const clean = result.data.filter(r => r.full_name);
        setRows(clean);
      },
    });
  };

  const handleExcelImport = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const clean = (jsonData as CsvRow[]).filter(r => r.full_name);
      setRows(clean);
    };

    reader.readAsBinaryString(file);
  };

  const handleImportToDatabase = async () => {
    if (!gymId || rows.length === 0) return;

    setLoading(true);

    const formatted = rows.map((r) => ({
      gym_id: gymId,
      full_name: r.full_name,
      phone: r.phone ?? "",
      email: r.email ?? "",
      weight: r.weight ? Number(r.weight) : null,
      height: r.height ? Number(r.height) : null,
      body_fat: r.body_fat ? Number(r.body_fat) : null,
      muscle_mass: r.muscle_mass ? Number(r.muscle_mass) : null,
      date_of_birth: r.date_of_birth ?? null,
      gender: r.gender ?? null,
      join_date: r.join_date ?? null,
      status: r.status ?? "active",
      notes: r.notes ?? "",
    }));

    const { error } = await supabase
      .from("members")
      .upsert(formatted, { onConflict: "gym_id,email" });

    setLoading(false);

    if (error) {
      alert("Import failed");
      return;
    }

    alert("Import successful");
    setRows([]);
    loadMembers();
  };

  /* ================= EXPORT ================= */

  const exportCsv = () => {
    const csv = Papa.unparse(members);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "members.csv";
    link.click();
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(members);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "members.xlsx");
  };

  const exportPdf = () => {
    const doc = new jsPDF();

    doc.text("Gym Members Report", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [[
        "Name",
        "Phone",
        "Email",
        "Weight",
        "Height",
        "Body Fat %",
        "Status"
      ]],
      body: members.map((m) => [
        m.full_name,
        m.phone,
        m.email,
        m.weight ?? "-",
        m.height ?? "-",
        m.body_fat ?? "-",
        m.status ?? "-"
      ]),
    });

    doc.save("members.pdf");
  };

  return (
    <div className="space-y-10">

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
      >
        Import / Export Members
      </motion.h1>

      {/* IMPORT */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
        <h2 className="text-xl font-semibold">Import Members</h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) =>
            e.target.files && handleCsvImport(e.target.files[0])
          }
          className="w-full p-3 bg-gray-800 rounded-xl"
        />

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) =>
            e.target.files && handleExcelImport(e.target.files[0])
          }
          className="w-full p-3 bg-gray-800 rounded-xl"
        />

        {rows.length > 0 && (
          <div className="text-sm text-gray-400">
            {rows.length} rows ready to import
          </div>
        )}

        <button
          onClick={handleImportToDatabase}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-xl"
        >
          {loading ? "Importing..." : "Import Members"}
        </button>
      </div>

      {/* EXPORT */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
        <h2 className="text-xl font-semibold">Export Members</h2>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={exportCsv}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
          >
            CSV
          </button>

          <button
            onClick={exportExcel}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
          >
            Excel
          </button>

          <button
            onClick={exportPdf}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl"
          >
            PDF
          </button>
        </div>
      </div>

    </div>
  );
}