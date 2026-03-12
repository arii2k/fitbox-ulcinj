"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Euro } from "lucide-react";
import jsPDF from "jspdf";

interface Payment {
  id: string;
  amount: number;
  membership_type: string;
  payment_method: string;
  created_at: string;
  invoice_number: string | null;
  members: {
    full_name: string;
    email: string;
  } | null;
}

export default function InvoicePage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    loadPayments();
  }, [monthFilter]);

  const loadPayments = async () => {
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

    let query = supabase
      .from("payments")
      .select(`
        id,
        amount,
        membership_type,
        payment_method,
        created_at,
        invoice_number,
        members ( full_name, email )
      `)
      .eq("gym_id", profile.gym_id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (monthFilter) {
      const start = new Date(monthFilter);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      query = query
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
    }

    const { data } = await query;

    const safeData: Payment[] = (data ?? []).map((item: any) => ({
      id: item.id,
      amount: item.amount,
      membership_type: item.membership_type,
      payment_method: item.payment_method,
      created_at: item.created_at,
      invoice_number: item.invoice_number,
      members: item.members,
    }));

    setPayments(safeData);

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSum = safeData
      .filter((p) => new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const todaySum = safeData
      .filter((p) => new Date(p.created_at) >= todayStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    setMonthlyTotal(monthSum);
    setTodayTotal(todaySum);

    setLoading(false);
  };

  const generateInvoiceNumber = (payment: Payment) => {
    if (payment.invoice_number) return payment.invoice_number;
    const year = new Date(payment.created_at).getFullYear();
    return `INV-${year}-${payment.id.slice(0, 6)}`;
  };

  const generateInvoice = (payment: Payment) => {
    const doc = new jsPDF();
    const invoiceNumber = generateInvoiceNumber(payment);

    doc.setFontSize(18);
    doc.text("INVOICE", 20, 20);

    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoiceNumber}`, 140, 20);
    doc.text(
      `Date: ${new Date(payment.created_at).toLocaleDateString()}`,
      140,
      30
    );

    doc.text("Bill To:", 20, 50);
    doc.text(`Name: ${payment.members?.full_name}`, 20, 60);
    doc.text(`Email: ${payment.members?.email}`, 20, 70);

    doc.line(20, 80, 190, 80);

    doc.text("Description", 20, 95);
    doc.text("Amount", 170, 95);

    doc.line(20, 100, 190, 100);

    doc.text(`${payment.membership_type} Membership`, 20, 115);
    doc.text(`€${payment.amount}`, 170, 115);

    doc.line(20, 130, 190, 130);

    doc.setFontSize(14);
    doc.text(`Total: €${payment.amount}`, 140, 150);

    doc.setFontSize(10);
    doc.text("Thank you for your business.", 20, 180);

    doc.save(`invoice-${invoiceNumber}.pdf`);
  };

  const filteredPayments = payments.filter((p) =>
    p.members?.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-gray-400">Loading invoices...</div>;
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Invoices & Reports
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={<Euro />} label="Revenue This Month" value={`€${monthlyTotal}`} />
        <StatCard icon={<FileText />} label="Revenue Today" value={`€${todayTotal}`} />
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700"
        />
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="p-3 bg-gray-800 rounded-lg border border-gray-700"
        />
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-4 text-left">Invoice #</th>
              <th className="p-4 text-left">Member</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Method</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">PDF</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr
                key={payment.id}
                className="border-t border-gray-800 hover:bg-gray-900/50 transition"
              >
                <td className="p-4">
                  {generateInvoiceNumber(payment)}
                </td>
                <td className="p-4">
                  {payment.members?.full_name}
                </td>
                <td className="p-4 text-green-400 font-medium">
                  €{payment.amount}
                </td>
                <td className="p-4 capitalize">
                  {payment.payment_method}
                </td>
                <td className="p-4">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => generateInvoice(payment)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No invoices found.
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
      <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>
    </div>
  );
}