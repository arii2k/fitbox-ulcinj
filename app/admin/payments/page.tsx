"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Euro, Wallet } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
}

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  expiry_date: string | null;
  created_at: string;
  members: { full_name: string } | null;
  plans: { name: string } | null;
}

interface Membership {
  id: string;
  full_name: string;
  membership_start: string | null;
  membership_end: string | null;
  status: string;
  plans: { name: string } | null;
}

export default function PaymentsPage() {

  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");

  const [previewExpiry, setPreviewExpiry] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState<number>(0);

  const [memberSearch, setMemberSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [membershipSearch, setMembershipSearch] = useState("");

  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {

    const plan = plans.find((p) => p.id === selectedPlan);

    if (!plan) {
      setPreviewExpiry(null);
      setFinalAmount(0);
      return;
    }

    const today = new Date();
    const expiry = new Date();

    expiry.setDate(today.getDate() + plan.duration_days);

    const discountValue = Number(discount) || 0;

    const calculated = Math.max(plan.price - discountValue, 0);

    setFinalAmount(calculated);
    setPreviewExpiry(expiry.toDateString());

  }, [selectedPlan, discount, plans]);

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

    const currentGymId = profile.gym_id;

    setGymId(currentGymId);

    const todayStr = new Date().toISOString().split("T")[0];

    await supabase
      .from("members")
      .update({ status: "expired" })
      .eq("gym_id", currentGymId)
      .eq("status", "active")
      .lt("membership_end", todayStr);

    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .eq("gym_id", currentGymId);

    const { data: membershipData } = await supabase
      .from("members")
      .select(`
        id,
        full_name,
        membership_start,
        membership_end,
        status,
        plans ( name )
      `)
      .eq("gym_id", currentGymId)
      .order("membership_end", { ascending: true });

    const { data: paymentsData } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_method,
        status,
        expiry_date,
        created_at,
        members ( full_name ),
        plans ( name )
      `)
      .eq("gym_id", currentGymId)
      .order("created_at", { ascending: false });

    const safePayments: Payment[] = (paymentsData ?? []).map((item: any) => ({
      id: item.id,
      amount: item.amount,
      payment_method: item.payment_method,
      status: item.status,
      expiry_date: item.expiry_date,
      created_at: item.created_at,
      members: item.members,
      plans: item.plans,
    }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSum = safePayments
      .filter(
        (p) =>
          p.status === "completed" &&
          new Date(p.created_at) >= monthStart
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);

    setMonthlyRevenue(monthSum);

    setPlans((plansData ?? []) as Plan[]);
    setPayments(safePayments);
    setMemberships((membershipData ?? []) as Membership[]);

    setLoading(false);

  };

  const searchMembers = async (value: string) => {

    setMemberSearch(value);

    if (!gymId) return;

    if (value.length < 2) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);

    const { data } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("gym_id", gymId)
      .ilike("full_name", `%${value}%`)
      .limit(20);

    setMembers((data ?? []) as Member[]);

    setLoadingMembers(false);

  };

  const handleRecordPayment = async () => {

    if (!selectedMember || !selectedPlan || !gymId) return;

    const plan = plans.find((p) => p.id === selectedPlan);

    if (!plan) return;

    const today = new Date();

    const expiryDate = new Date(
      today.getTime() + plan.duration_days * 86400000
    );

    const status =
      paymentMethod === "online" ? "pending" : "completed";

    const { error } = await supabase
      .from("payments")
      .insert([
        {
          gym_id: gymId,
          member_id: selectedMember,
          plan_id: plan.id,
          amount: Number(finalAmount),
          discount: Number(discount),
          payment_method: paymentMethod,
          status,
          start_date: today.toISOString(),
          expiry_date: expiryDate.toISOString(),
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    if (status === "completed") {

      await supabase
        .from("members")
        .update({
          plan_id: plan.id,
          membership_start: today,
          membership_end: expiryDate,
          status: "active",
        })
        .eq("id", selectedMember);

    }

    setSelectedMember("");
    setSelectedPlan("");
    setDiscount("0");

    loadData();

  };

  const filteredPayments = payments.filter((p) =>
    p.members?.full_name
      ?.toLowerCase()
      .includes(paymentSearch.toLowerCase())
  );

  const filteredMemberships = memberships.filter((m) =>
    m.full_name.toLowerCase().includes(membershipSearch.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  return (

    <div className="space-y-10">

      <h1 className="text-4xl font-bold text-white">
        Payments & Revenue
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <StatCard icon={<Euro />} label="Revenue This Month" value={`€${monthlyRevenue}`} />

        <StatCard icon={<Wallet />} label="Total Payments" value={payments.length} />

      </div>

      {/* MEMBERSHIP TABLE */}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

        <div className="p-4 border-b border-gray-800 flex justify-between">

          <h2 className="text-lg font-semibold">Membership Status</h2>

          <input
            type="text"
            placeholder="Search member..."
            value={membershipSearch}
            onChange={(e) => setMembershipSearch(e.target.value)}
            className="p-2 bg-gray-800 rounded-lg border border-gray-700"
          />

        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-4 text-left">Member</th>
              <th className="p-4 text-left">Plan</th>
              <th className="p-4 text-left">Joined</th>
              <th className="p-4 text-left">Expires</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>

            {filteredMemberships.map((m) => {

              const expiry = m.membership_end
                ? new Date(m.membership_end)
                : null;

              const today = new Date();

              const daysLeft = expiry
                ? Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
                : null;

              let statusColor = "text-green-400";
              let statusText = "Active";

              if (daysLeft !== null && daysLeft <= 5 && daysLeft > 0) {
                statusColor = "text-yellow-400";
                statusText = `Expiring in ${daysLeft} days`;
              }

              if (daysLeft !== null && daysLeft <= 0) {
                statusColor = "text-red-400";
                statusText = "Expired";
              }

              return (

                <tr key={m.id} className="border-t border-gray-800">

                  <td className="p-4">{m.full_name}</td>

                  <td className="p-4">{m.plans?.name ?? "-"}</td>

                  <td className="p-4">
                    {m.membership_start
                      ? new Date(m.membership_start).toDateString()
                      : "-"}
                  </td>

                  <td className="p-4">
                    {m.membership_end
                      ? new Date(m.membership_end).toDateString()
                      : "-"}
                  </td>

                  <td className={`p-4 font-semibold ${statusColor}`}>
                    {statusText}
                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    {/* RECORD PAYMENT */}

<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-5"
>

<h2 className="text-xl font-semibold">Record Payment</h2>

{/* SEARCH FIELD */}

<input
  type="text"
  placeholder="Search member..."
  value={memberSearch}
  onChange={(e) => {
    setMemberSearch(e.target.value)
    searchMembers(e.target.value)
  }}
  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
/>

{loadingMembers && (
  <div className="text-gray-400 text-sm">
    Searching members...
  </div>
)}

{/* SEARCH RESULTS */}

{members.length > 0 && memberSearch.length >= 2 && !selectedMember && (

<div className="max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg">

{members.map((m) => (

<div
key={m.id}
onClick={() => {

setSelectedMember(m.id)      // save selected member ID
setMemberSearch(m.full_name) // fill input with name
setMembers([])               // hide dropdown

}}
className="p-3 cursor-pointer border-b border-gray-800 hover:bg-gray-800"
>

{m.full_name}

</div>

))}

</div>

)}

{/* SELECTED MEMBER */}

{selectedMember && (

<div className="bg-green-900/30 border border-green-700 p-3 rounded-lg text-green-400 text-sm">

Selected member: {memberSearch}

</div>

)}

{/* PLAN */}

<select
value={selectedPlan}
onChange={(e) => setSelectedPlan(e.target.value)}
className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
>
<option value="">Select Plan</option>

{plans.map((p) => (

<option key={p.id} value={p.id}>
{p.name} - €{p.price}
</option>

))}

</select>

{/* DISCOUNT */}

<input
type="number"
value={discount}
onChange={(e) => setDiscount(e.target.value)}
placeholder="Discount (€)"
className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
/>

{/* PAYMENT METHOD */}

<select
value={paymentMethod}
onChange={(e) => setPaymentMethod(e.target.value)}
className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
>
<option value="cash">Cash</option>
<option value="card">Card</option>
<option value="online">Online</option>
<option value="mixed">Mixed</option>
</select>

{/* PREVIEW */}

{previewExpiry && (
<div className="bg-gray-800 p-4 rounded-lg text-sm">
<p>Final Amount: €{finalAmount}</p>
<p>New Expiry: {previewExpiry}</p>
</div>
)}

{/* CONFIRM */}

<button
onClick={handleRecordPayment}
className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl w-full"
>
Confirm Payment
</button>

</motion.div>
      {/* PAYMENTS TABLE */}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

        <div className="p-4 border-b border-gray-800">

          <input
            type="text"
            placeholder="Search payments..."
            value={paymentSearch}
            onChange={(e) => setPaymentSearch(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700"
          />

        </div>

        <table className="w-full text-sm">

          <thead className="bg-gray-800 text-gray-300">

            <tr>
              <th className="p-4 text-left">Member</th>
              <th className="p-4 text-left">Plan</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Status</th>
            </tr>

          </thead>

          <tbody>

            {filteredPayments.map((payment) => (

              <tr key={payment.id} className="border-t border-gray-800">

                <td className="p-4">{payment.members?.full_name}</td>

                <td className="p-4">{payment.plans?.name}</td>

                <td className="p-4 text-green-400">
                  €{payment.amount}
                </td>

                <td className="p-4">{payment.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

function StatCard({ icon, label, value }: any) {

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
      <div className="text-blue-400 mb-3">{icon}</div>
      <p className="text-gray-400">{label}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );

}