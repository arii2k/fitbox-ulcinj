"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Dumbbell,
  Building2,
  Menu,
  X,
  Activity,
  QrCode,
  LineChart,
} from "lucide-react";

import { checkPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import { checkSubscription } from "@/lib/subscription";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAll = async () => {

      // ✅ Prevent loop on subscription page
      if (pathname === "/admin/subscription-required") {
        setAllowed(true);
        return;
      }

      // 🔒 1️⃣ Check subscription first
      const subscriptionValid = await checkSubscription();

      if (!subscriptionValid) {
        router.push("/admin/subscription-required");
        return;
      }

      // 🔐 2️⃣ Route Permission Mapping
      const routePermissions: Record<string, Permission> = {
        "/admin/members": "can_manage_members",
        "/admin/payments": "can_manage_payments",
        "/admin/plans": "can_manage_plans",
        "/admin/trainers": "can_manage_trainers",
        "/admin/expenses": "can_manage_expenses",
        "/admin/reports": "can_view_reports",
        "/admin/session": "can_manage_sessions",
        "/admin/staff": "can_manage_members",
        "/admin/settings": "can_manage_plans",
        "/admin/branches": "can_manage_plans",
        "/admin/import": "can_manage_members",
        "/admin/invoices": "can_manage_payments",
      };

      const required = Object.entries(routePermissions).find(([route]) =>
        pathname.startsWith(route)
      );

      if (!required) {
        setAllowed(true);
        return;
      }

      const hasPermission = await checkPermission(required[1]);

      if (!hasPermission) {
        router.push("/admin/dashboard");
        return;
      }

      setAllowed(true);
    };

    verifyAll();
  }, [pathname, router]);

  if (allowed === null) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Checking permissions...
      </div>
    );
  }

  const NavItem = ({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }) => {
    const active = pathname.startsWith(href);

    return (
      <Link href={href}>
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer ${
            active
              ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          }`}
        >
          {icon}
          <span className="text-sm">{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* SIDEBAR */}
      <aside
        className={`w-72 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 p-6
        ${open ? "block" : "hidden"} md:block`}
      >
        <h2 className="text-2xl font-bold mb-10 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          FITBOX ADMIN
        </h2>

        <div className="space-y-4">

          {/* CORE */}
          <NavItem href="/admin/dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} />
          <NavItem href="/admin/analytics" label="Analytics" icon={<LineChart size={18} />} />

          {/* MEMBERS */}
          <NavItem href="/admin/members" label="Members" icon={<Users size={18} />} />
          <NavItem href="/admin/attendance" label="Attendance" icon={<Dumbbell size={18} />} />
          <NavItem href="/admin/checkin" label="Check-In" icon={<QrCode size={18} />} />
          <NavItem href="/admin/measurements" label="Measurements" icon={<Activity size={18} />} />

          {/* FINANCE */}
          <NavItem href="/admin/plans" label="Plans" icon={<FileText size={18} />} />
          <NavItem href="/admin/payments" label="Payments" icon={<CreditCard size={18} />} />
          <NavItem href="/admin/invoices" label="Invoices" icon={<FileText size={18} />} />
          <NavItem href="/admin/expenses" label="Expenses" icon={<BarChart3 size={18} />} />
          <NavItem href="/admin/reports" label="Reports" icon={<BarChart3 size={18} />} />

          {/* MANAGEMENT */}
          <NavItem href="/admin/staff" label="Staff" icon={<Users size={18} />} />
          <NavItem href="/admin/trainers" label="Trainers" icon={<Users size={18} />} />
          <NavItem href="/admin/session" label="Sessions" icon={<Dumbbell size={18} />} />
          <NavItem href="/admin/branches" label="Branches" icon={<Building2 size={18} />} />
          <NavItem href="/admin/import" label="Import / Export" icon={<FileText size={18} />} />
          <NavItem href="/admin/qr" label="QR Generator" icon={<QrCode size={18} />} />

          {/* SETTINGS */}
          <NavItem href="/admin/settings" label="Settings" icon={<Settings size={18} />} />
          <NavItem href="/admin/settings/roles" label="Roles & Permissions" icon={<Settings size={18} />} />
          <NavItem href="/admin/settings/general" label="General Settings" icon={<Settings size={18} />} />
          <NavItem href="/admin/settings/account" label="Account Settings" icon={<Settings size={18} />} />

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="text-lg font-semibold">FITBOX ADMIN</h1>
        </div>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}