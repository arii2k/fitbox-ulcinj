"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingDown, Receipt } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
}

export default function ExpensesPage() {

  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {

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

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("gym_id", profile.gym_id)
      .order("expense_date", { ascending: false });

    const safeExpenses: Expense[] = (data ?? []).map((item: any) => ({
      id: item.id,
      category: item.category,
      amount: item.amount,
      description: item.description,
      expense_date: item.expense_date,
    }));

    setExpenses(safeExpenses);
    setLoading(false);

  };

 const handleAddExpense = async () => {

  if (!category || !amount) {
    alert("Category and amount required");
    return;
  }

  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    alert("Not authenticated");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("gym_id")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile?.gym_id) {
    console.error(profileError);
    alert("Gym not found");
    return;
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([
      {
        gym_id: profile.gym_id,
        category: category,
        amount: Number(amount),
        description: description,
        expense_date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error("Insert error:", error);
    alert(error.message);
    return;
  }

  console.log("Expense saved:", data);

  setCategory("");
  setAmount("");
  setDescription("");

  loadExpenses();

};

  if (loading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const filteredExpenses = expenses.filter((e) =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyExpenses = expenses
    .filter((e) => new Date(e.expense_date) >= monthStart)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (

    <div className="space-y-10">

      {/* TITLE */}

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Expense Management
      </h1>

      {/* KPI */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <StatCard
          icon={<TrendingDown />}
          label="Total Expenses"
          value={`€${totalExpenses}`}
        />

        <StatCard
          icon={<TrendingDown />}
          label="Expenses This Month"
          value={`€${monthlyExpenses}`}
        />

      </div>

      {/* ADD EXPENSE */}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4"
      >

        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt size={18} /> Add Expense
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

          <input
            type="number"
            placeholder="Amount (€)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

        </div>

        <button
          onClick={handleAddExpense}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-medium"
        >
          Save Expense
        </button>

      </motion.div>


      {/* EXPENSE TABLE */}

      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

        <div className="p-4 border-b border-gray-800 flex justify-between">

          <h2 className="font-semibold">All Expenses</h2>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 bg-gray-800 rounded-lg border border-gray-700"
          />

        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-800 text-gray-300">

            <tr>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Description</th>
              <th className="p-4 text-left">Date</th>
            </tr>

          </thead>

          <tbody>

            {filteredExpenses.map((expense) => (

              <tr
                key={expense.id}
                className="border-t border-gray-800 hover:bg-gray-900/50 transition"
              >

                <td className="p-4">{expense.category}</td>

                <td className="p-4 text-red-400 font-medium">
                  €{expense.amount}
                </td>

                <td className="p-4">{expense.description}</td>

                <td className="p-4">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </td>

              </tr>

            ))}

            {filteredExpenses.length === 0 && (

              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No expenses recorded.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

function StatCard({ icon, label, value }: any) {

  return (

    <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl">

      <div className="mb-3 text-blue-400">{icon}</div>

      <p className="text-gray-400 text-sm">{label}</p>

      <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>

    </div>

  );

}