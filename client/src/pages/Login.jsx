import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Eye, EyeOff, Github, Mail } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", formData);
      if (response.data.success) {
        alert("Login successful!");
        console.log(response.data.token);
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github";
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* Card */}
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Login button */}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Login
            </button>

            {/* Forgot password link */}
            <div className="mt-4">
              <Link to="/forgot-password-page" className="text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>

            {/* Register link */}
            <div className="mt-2">
              Don't have an account? 
              <Link to="/register" className="text-blue-600 hover:underline">
                register here!
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <hr className="flex-1 border-gray-300 dark:border-gray-600" />
              <span className="px-3 text-gray-500 text-sm">OR</span>
              <hr className="flex-1 border-gray-300 dark:border-gray-600" />
            </div>

            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Mail className="w-5 h-5" />
              Sign in with Google
            </button>

            {/* GitHub login */}
            <button
              type="button"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
