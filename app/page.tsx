"use client";

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import { translations } from "./data/translations";
import Lenis from "lenis";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";

export default function Home() {

  // Language state
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lang") || "en";
    }
    return "en";
  });

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Lenis smooth scroll
 useEffect(() => {
  const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
  });

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // 👇 ADD THIS LINE
  (window as any).lenis = lenis;

  return () => {
    lenis.destroy();
  };
}, []);

  const t = translations[lang as keyof typeof translations];
  const fadeUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};
const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const fadeItem: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 }
};

  return (
    <main className="bg-gray-950 text-white">
      <Navbar setLang={setLang} />
      
{/* HERO */}
<section
  id="home"
  className="min-h-[85vh] flex items-center px-6 pt-24 bg-gradient-to-b from-black via-black to-gray-950"
>
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">

    {/* Left Side Text */}
    <motion.div
      className="flex-1"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <p className="text-sm text-blue-500 uppercase tracking-widest mb-4">
        {t.heroBadge}
      </p>

      <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6">
        FITBOX
        <br />
        <span className="text-blue-500">ULCINJ</span>
      </h1>

      <p className="text-gray-400 text-lg max-w-xl mb-10">
        {t.heroDescription}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap gap-8 mb-10 text-sm text-gray-400">
        <div>
          <p className="text-2xl font-bold text-white">10+</p>
          <p>{t.yearsExperience}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">500+</p>
          <p>{t.transformations}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">IFBB</p>
          <p>{t.certified}</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>{t.address}</p>
        <p>{t.workingHours}</p>
      </div>

      <div className="flex flex-wrap gap-4 mt-8">
        <a
          href="https://www.google.com/maps/place/FIT+BOX+%E2%80%A2+GYM+%7C+CROSSFIT+%7C+AEROBIC/@41.9302734,19.2263488"
          target="_blank"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition"
        >
          {t.getDirections}
        </a>

        <a
          href="tel:+38269572744"
          className="px-8 py-4 border border-gray-700 hover:border-blue-500 rounded-md font-semibold transition"
        >
          {t.callNow}
        </a>
        <Link
          href="/login"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition"
              >
                Admin Login
            </Link>
          </div>
        </motion.div>

    {/* Right Side Video */}
    <motion.div
      className="flex-1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
        <video
          src="/video-fitboxulcinj.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>

  </div>
</section>


{/* SERVICES */}
<motion.section
  id="services"
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6">

    <div className="mb-20">
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
        {t.servicesSection}
      </p>
      <h2 className="text-5xl font-bold">
        {t.servicesTitle}
      </h2>
    </div>

    <motion.div
      className="grid md:grid-cols-3 gap-12"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >

      {/* Service 1 */}
      <motion.div
        className="border border-gray-800 p-8 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition"
        variants={fadeItem}
      >
        <h3 className="text-2xl font-semibold mb-4">
          {t.service1Title}
        </h3>
        <p className="text-gray-400">
          {t.service1Desc}
        </p>

        <ul className="mt-6 space-y-2 text-sm text-gray-500">
          <li>• Weekly progress tracking</li>
          <li>• Periodized training cycles</li>
          <li>• Nutrition integration</li>
          <li>• Direct IFBB supervision</li>
        </ul>

        <a
          href="#programs"
          className="inline-block mt-6 text-blue-500 font-semibold hover:underline"
        >
          {t.viewPrograms}
        </a>
      </motion.div>

      {/* Service 2 */}
      <motion.div
        className="border border-gray-800 p-8 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition"
        variants={fadeItem}
      >
        <h3 className="text-2xl font-semibold mb-4">
          {t.service2Title}
        </h3>
        <p className="text-gray-400">
          {t.service2Desc}
        </p>

        <ul className="mt-6 space-y-2 text-sm text-gray-500">
          <li>• Strength & endurance cycles</li>
          <li>• Small structured groups</li>
          <li>• Performance-based metrics</li>
          <li>• Injury prevention focus</li>
        </ul>

        <a
          href="#programs"
          className="inline-block mt-6 text-blue-500 font-semibold hover:underline"
        >
          {t.viewPrograms}
        </a>
      </motion.div>

      {/* Service 3 */}
      <motion.div
        className="border border-gray-800 p-8 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition"
        variants={fadeItem}
      >
        <h3 className="text-2xl font-semibold mb-4">
          {t.service3Title}
        </h3>
        <p className="text-gray-400">
          {t.service3Desc}
        </p>

        <ul className="mt-6 space-y-2 text-sm text-gray-500">
          <li>• Personalized calorie strategy</li>
          <li>• Macro control systems</li>
          <li>• Competition cutting protocol</li>
          <li>• Long-term sustainability</li>
        </ul>

        <a
          href="#meals"
          className="inline-block mt-6 text-blue-500 font-semibold hover:underline"
        >
          {t.viewMenu}
        </a>
      </motion.div>

    </motion.div>

  </div>
</motion.section>

{/* TRAINERS */}
<motion.section
  id="trainers"
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6">

    <div className="mb-20">
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
        {t.trainersSection}
      </p>
      <h2 className="text-5xl font-bold">
        {t.trainersTitle}
      </h2>
    </div>

    <div className="grid md:grid-cols-3 gap-12">

      {/* Jasmin Hot */}
      <div className="border border-gray-800 hover:border-blue-500 transition">
        <div className="h-80 overflow-hidden">
          <img
            src="/jasmin.jpg"
            alt="Jasmin Hot"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-2">Jasmin Hot</h3>
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-4">
            {t.president}
          </p>
          <p className="text-gray-400">
            {t.jasminDesc}
          </p>
        </div>
      </div>

      {/* Medina Hot */}
      <div className="border border-gray-800 hover:border-blue-500 transition">
        <div className="h-80 overflow-hidden">
          <img
            src="/medina.jpeg"
            alt="Medina Hot"
            className="w-full h-full object-cover object-[center_35%]"
          />
        </div>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-2">Medina Hot</h3>
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-4">
            {t.director}
          </p>
          <p className="text-gray-400">
            {t.medinaDesc}
          </p>
        </div>
      </div>

           {/* Besi Rexha */}
      <div className="border border-gray-800 hover:border-blue-500 transition">
        <div className="h-80 overflow-hidden">
          <img
            src="/besi.jpg"
            alt="Besi Rexha"
             className="w-full h-full object-cover object-top scale-110"
          />
        </div>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-2">Besi Rexha</h3>
          <p className="text-gray-500 text-sm uppercase tracking-wide mb-4">
            {t.trainer}
          </p>
          <p className="text-gray-400">
            {t.besiDesc}
          </p>
        </div>
      </div>

    </div>

  </div>
</motion.section>

    {/* PROGRAMS */}
<motion.section
  id="programs"
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6">

    <div className="mb-20">
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
        {t.programsSection}
      </p>
      <h2 className="text-5xl font-bold">
        {t.programsTitle}
      </h2>
    </div>

    <div className="space-y-16">

      <div className="grid md:grid-cols-2 gap-12 border-b border-gray-900 pb-16">
        <div>
          <h3 className="text-3xl font-semibold mb-4">
            {t.program1Title}
          </h3>
          <p className="text-gray-400">
           {t.program1Desc}
          </p>
        </div>
        <div className="text-gray-500">
          {t.program1Meta}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 border-b border-gray-900 pb-16">
        <div>
          <h3 className="text-3xl font-semibold mb-4">
            {t.program2Title}
          </h3>
          <p className="text-gray-400">
           {t.program2Desc}
          </p>
        </div>
        <div className="text-gray-500">
          {t.program2Meta}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-3xl font-semibold mb-4">
            {t.program3Title}
          </h3>
          <p className="text-gray-400">
           {t.program3Desc}
          </p>
        </div>
        <div className="text-gray-500">
          {t.program3Meta}
        </div>
      </div>

    </div>

  </div>
</motion.section>

{/* NUTRITION MENU */}
<motion.section
  id="meals"
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-7xl mx-auto px-6">

    <div className="mb-20">
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
        {t.mealsSection}
      </p>
      <h2 className="text-5xl font-bold">
        {t.mealsTitle}
      </h2>
    </div>

    <div className="grid lg:grid-cols-2 gap-20 items-start">

      {/* LEFT SIDE — FULL MENU */}
      <div className="space-y-6 text-lg">

        {[
          ["Protein with Water", "1.5€"],
          ["Protein with Milk", "1.8€"],
          ["Vitamin Shake", "3.0€"],
          ["FIT BOX Shake", "3.0€ / 3.3€"],
          ["FIT Green Shake", "3.0€"],
          ["FIT BOX Granola", "3.7€"],
          ["FIT Chia Granola", "3.7€"],
          ["FIT Butter Granola", "3.7€"],
          ["FIT Protein Muesli", "3.7€"],
          ["FIT Protein Tortilja / Tost", "2.5€"],
          ["FIT Sweet Tortilja / Tost", "2.5€"],
          ["Protein Coffee", "2.0€"],
          ["Espresso Coffee", "1.0€"],
        ].map((item, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-gray-800 pb-4 hover:border-blue-500 transition"
          >
            <span className="text-gray-300">{item[0]}</span>
            <span className="text-blue-500 font-semibold">{item[1]}</span>
          </div>
        ))}

      </div>

      {/* RIGHT SIDE — BIGGER CLEAN PHOTOS */}
      <div className="space-y-10">

        <div className="relative h-80 rounded-2xl overflow-hidden border border-gray-800 group">
  <img
    src="/meal1.jpg"
    alt="Meal 1"
    className="w-full h-full object-cover object-[center_75%] transition duration-700 group-hover:scale-105"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
</div>


       <div className="relative h-80 rounded-2xl overflow-hidden border border-gray-800 group">
  <img
    src="/meal2.jpg"
    alt="Meal 2"
    className="w-full h-full object-cover object-[center_75%] transition duration-700 group-hover:scale-105"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
</div>


        <div className="relative h-80 rounded-2xl overflow-hidden border border-gray-800 group">
  <img
    src="/meal3.jpg"
    alt="Meal 3"
    className="w-full h-full object-cover object-[center_85%] transition duration-700 group-hover:scale-105"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
</div>


      </div>

    </div>

  </div>
</motion.section>
{/* ACHIEVEMENTS */}
<motion.section
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6 text-center">

    <p className="text-sm text-gray-500 uppercase tracking-widest mb-6">
      {t.achievementBadge}
    </p>

    <h2 className="text-5xl font-bold mb-10">
      {t.achievementTitle}
    </h2>

    <p className="text-gray-400 max-w-3xl mx-auto text-lg">
      {t.achievementDesc}
    </p>

  </div>
</motion.section>

{/* CTA */}
<motion.section
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6">

    <div className="grid md:grid-cols-2 gap-16 items-center">

      <div>
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
  {t.visitSection}
</p>

<h2 className="text-5xl font-bold mb-6">
  {t.visitTitle}
</h2>

<p className="text-gray-400 max-w-lg">
 {t.visitDesc}
</p>

      </div>

     <div className="flex flex-col md:flex-row gap-4 md:justify-end">

  <a
    href="https://www.google.com/maps/place/FIT+BOX+%E2%80%A2+GYM+%7C+CROSSFIT+%7C+AEROBIC/@41.9302773,19.2214779,17z/data=!3m1!4b1!4m6!3m5!1s0x134e13006b9ffca3:0xbaa7f70b976fc53d!8m2!3d41.9302734!4d19.2263488!16s%2Fg%2F11vq9tb1xx?entry=ttu&g_ep=EgoyMDI2MDIxMS4wIKXMDSoASAFQAw%3D%3D"
    target="_blank"
    className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
  >
    {t.getDirections}
  </a>

  <a
    href="tel:+38269572744"
    className="px-12 py-4 border border-gray-700 hover:border-blue-500 rounded-md font-semibold transition"
  >
    {t.callNow}
  </a>

</div>
</div>
  </div>
</motion.section>
{/* MAP */}
<motion.section
  className="py-32 bg-black border-t border-gray-900"
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: false, amount: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6">

    <h2 className="text-3xl font-bold mb-8 text-center">
      {t.findUs}
    </h2>

    <div className="rounded-xl overflow-hidden border border-gray-800">
      <iframe
        src="https://www.google.com/maps?q=41.9302734,19.2263488&output=embed"
        width="100%"
        height="450"
        loading="lazy"
      ></iframe>
    </div>

  </div>
</motion.section>

{/* FOOTER */}
<footer className="border-t border-gray-900 bg-black py-16">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">

    <div>
      <h3 className="text-xl font-semibold mb-4">FITBOX</h3>
      <p className="text-gray-500">
        {t.footerDesc}
      </p>
    </div>

    <div>
      <h4 className="text-sm uppercase text-gray-500 mb-4 tracking-widest">
        {t.contact}
      </h4>
      <p className="text-gray-400">{t.address}</p>
<a
  href="tel:+38269572744"
  className="text-gray-400 hover:text-blue-500 transition"
>
  +382 69 572 744
</a>
<p className="text-gray-400">{t.workingHours}</p>

    </div>

   <div>
  <h4 className="text-sm uppercase text-gray-500 mb-4 tracking-widest">
    {t.social}
  </h4>

  <a
    href="https://www.instagram.com/fitbox_ulcinj"
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-400 hover:text-blue-500 transition block"
  >
    {t.instagram}
  </a>

  <a
    href="https://www.facebook.com/FitnessCrossfitFIT"
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-400 hover:text-blue-500 transition block mt-2"
  >
    {t.facebook}
  </a>
</div>


  </div>

  <div className="mt-16 text-center text-gray-600 text-sm">
    © {new Date().getFullYear()} FitBox Ulcinj. {t.rights}
  </div>
</footer>



    </main>
  );
}
