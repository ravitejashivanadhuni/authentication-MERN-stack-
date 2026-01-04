import react from 'react';
import { useTheme } from '../context/ThemeContext';


export default function Dashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
    return (
        <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
            {/* Top navbar with theme toggle */}
            <div className="w-full flex justify-end p-4">
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
            >
                {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.03a1 1 0 010 1.41l-.71.7a1 1 0 11-1.42-1.4l.7-.71a1 1 0 011.43-.01zM18 9a1 1 0 110 2h-1a1 1 0 110-2h1zm-2.03 5.78a1 1 0 01-1.41 0l-.7-.71a1 1 0 111.4-1.42l.71.7a1 1 0 01.01 1.43zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-5.78-2.03a1 1 0 010-1.41l.71-.7a1 1 0 111.42 1.4l-.7.71a1 1 0 01-1.43.01zM4 9a1 1 0 110-2H3a1 1 0 110 2h1zm2.03-5.78a1 1 0 011.41 0l.7.71a1 1 0 11-1.4 1.42l-.71-.7a1 1 0 01-.01-1.43z" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                )}
            </button>
            <button
                onClick={() => {
                    // Clear any authentication tokens or user data here
                    window.location.href = '/login'; // Redirect to login page
                }}
                className="ml-4 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            >
                Logout
            </button>
            </div>
            {/* Centered content */}
            <div className="flex-grow flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-6">Welcome to the Dashboard</h1>
            <h3 className="text-lg mb-8">You have successfully logged in.</h3>
            </div>
        </div>
        </div>
    );
}