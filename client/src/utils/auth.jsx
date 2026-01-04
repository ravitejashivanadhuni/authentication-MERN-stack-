//give me code for this utility checks auth status
export const isAuthenticated = () => {
  // Check for a token in localStorage (or cookies)
  const token = localStorage.getItem('token');
  return !!token; // Returns true if token exists, false otherwise
}
