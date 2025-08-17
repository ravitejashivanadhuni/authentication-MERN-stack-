// src/pages/Landing.js
import React from "react";
import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Landing() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
      {/* Top navbar with theme toggle */}
      <div className="w-full flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
        >
          {isDarkMode ? (
            <FaSun className="text-yellow-400 text-xl" />
          ) : (
            <FaMoon className="text-blue-500 text-xl" />
          )}
        </button>
      </div>

      {/* Centered content */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to the ready made authentication</h1>
        <div className="flex gap-4">
          <a
            href="/login"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
