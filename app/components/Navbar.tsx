"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";

type NavbarProps = {
  setLang: (lang: string) => void;
};

export default function Navbar({ setLang }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  const NavItem = ({ id, label }: { id: string; label: string }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={() => scrollToSection(id)}
      className="relative text-gray-300 hover:text-white transition"
    >
      {label}
      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full" />
    </motion.button>
  );

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/70 backdrop-blur-2xl border-b border-blue-800/30 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-[1400px] mx-auto flex justify-between items-center px-6">

        {/* LOGO */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => scrollToSection("home")}
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          FITBOX
        </motion.button>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-6 text-sm">

  <NavItem id="home" label="Home" />
  <NavItem id="services" label="Services" />
  <NavItem id="trainers" label="Trainers" />
  <NavItem id="programs" label="Programs" />
  <NavItem id="meals" label="Meals" />

  {/* LOGIN BUTTONS */}
  <div className="flex space-x-3">
    <Link
      href="/login"
      className="px-4 py-2 text-sm border border-gray-700 rounded-md hover:border-blue-500 transition"
    >
      User Login
    </Link>

    <Link
      href="/login"
      className="px-4 py-2 text-sm bg-blue-600 rounded-md hover:bg-blue-700 transition"
    >
      Admin
    </Link>
  </div>

  {/* LANGUAGE SWITCH */}
  <div className="flex space-x-2 ml-6">
            {["en", "me", "sq"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLang(lang)}
                className="px-3 py-1 rounded-full text-xs bg-gray-800 hover:bg-blue-600 transition"
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gray-300"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-t border-blue-800/30"
          >
            <div className="flex flex-col items-center py-8 space-y-6 text-gray-300 text-lg">

              <NavItem id="home" label="Home" />
              <NavItem id="services" label="Services" />
              <NavItem id="trainers" label="Trainers" />
              <NavItem id="programs" label="Programs" />
              <NavItem id="meals" label="Meals" />
              <Link
  href="/login"
  className="px-6 py-3 border border-gray-700 rounded-md hover:border-blue-500 transition"
>
  User Login
</Link>

<Link
  href="/login"
  className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 transition"
>
  Admin Login
</Link>

              <div className="flex space-x-4 pt-6 border-t border-gray-800">
                {["en", "me", "sq"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLang(lang)}
                    className="px-4 py-2 rounded-full bg-gray-800 hover:bg-blue-600 transition"
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}