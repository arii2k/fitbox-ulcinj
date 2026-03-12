"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const cards = [
    {
      title: "Roles & Permissions",
      description: "Manage staff roles and access control",
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      route: "/admin/settings/roles",
    },
    {
      title: "Branches",
      description: "Manage gym locations",
      icon: <Building2 className="w-6 h-6 text-green-400" />,
      route: "/admin/branches",
    },
    {
      title: "Trainers",
      description: "Manage trainers and commissions",
      icon: <Users className="w-6 h-6 text-purple-400" />,
      route: "/admin/trainers",
    },
    {
      title: "General Settings",
      description: "System & gym configuration",
      icon: <SettingsIcon className="w-6 h-6 text-cyan-400" />,
      route: "/admin/settings/general",
    },
    {
      title: "Account Settings",
      description: "Manage your profile & password",
      icon: <Users className="w-6 h-6 text-yellow-400" />,
      route: "/admin/settings/account",
    }
  ];

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            onClick={() =>
              card.route !== "#" && router.push(card.route)
            }
            className="cursor-pointer bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 rounded-2xl shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              {card.icon}
              <h2 className="text-xl font-semibold text-white">
                {card.title}
              </h2>
            </div>

            <p className="text-gray-400 text-sm">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}