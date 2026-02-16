"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    const lenis = (window as any).lenis;

    if (lenis) {
      lenis.scrollTo(element);
    } else {
      element.scrollIntoView({ behavior: "smooth" });
    }

    setOpen(false);
  };

  const NavItem = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => scrollToSection(id)}
      className="hover:text-blue-500 transition"
    >
      {label}
    </button>
  );

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md border-b border-gray-800 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6">

        {/* LOGO */}
        <button
          onClick={() => scrollToSection("home")}
          className="text-lg md:text-xl font-bold text-blue-500"
        >
          FITBOX
        </button>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center space-x-8 text-gray-300 text-sm">
          <NavItem id="home" label="Home" />
          <NavItem id="services" label="Services" />
          <NavItem id="trainers" label="Trainers" />
          <NavItem id="programs" label="Programs" />
          <NavItem id="meals" label="Meals" />

          <div className="flex space-x-3 ml-4">
            <button onClick={() => setLang("en")} className="hover:text-blue-500 transition">EN</button>
            <button onClick={() => setLang("me")} className="hover:text-blue-500 transition">ME</button>
            <button onClick={() => setLang("sq")} className="hover:text-blue-500 transition">SQ</button>
          </div>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gray-300 text-2xl"
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-black border-t border-gray-800"
          >
            <div className="flex flex-col items-center py-6 space-y-6 text-gray-300">
              <NavItem id="home" label="Home" />
              <NavItem id="services" label="Services" />
              <NavItem id="trainers" label="Trainers" />
              <NavItem id="programs" label="Programs" />
              <NavItem id="meals" label="Meals" />

              <div className="flex space-x-4 pt-4 border-t border-gray-800">
                <button onClick={() => setLang("en")} className="hover:text-blue-500 transition">EN</button>
                <button onClick={() => setLang("me")} className="hover:text-blue-500 transition">ME</button>
                <button onClick={() => setLang("sq")} className="hover:text-blue-500 transition">SQ</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
