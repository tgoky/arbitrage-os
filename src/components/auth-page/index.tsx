import React, { useState, useEffect } from "react";
import { HardDrive, File, Trash2, Edit, Brush, Clock } from "lucide-react";

// Mock AuthPageBase for debugging
const MockAuthPageBase = ({ type }: { type: string }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = () => {
    console.log("Form submitted!", { type, email, password });
    alert(`${type} form submitted with email: ${email}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        style={{ zIndex: 1000, position: 'relative', cursor: 'pointer' }}
      >
        {type === "login" ? "Sign In" : "Sign Up"}
      </button>
    </div>
  );
};

export default function AuthPage({ type = "login" }: { type?: string }) {
  const [activeWindow, setActiveWindow] = useState("auth");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-teal-700">
      {/* Desktop Background */}
      <div className="flex-1 relative bg-gradient-to-br from-teal-600 to-teal-800 p-4 overflow-hidden">
        {/* Desktop Icons Container */}
        <div className="absolute left-0 top-0 p-6 space-y-8 flex flex-col">
          {/* My Computer Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("my-computer")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <rect x="8" y="12" width="40" height="30" rx="2" fill="#1084D0" />
                <rect x="12" y="16" width="32" height="22" fill="#000" />
                <path d="M12 16 L44 16 L36 24 Z" fill="white" fillOpacity="0.2" />
                <rect x="24" y="42" width="8" height="4" fill="#595959" />
                <rect x="20" y="46" width="16" height="4" fill="#808080" />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Computer
            </span>
          </div>

          {/* My Documents Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("documents")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <path
                  d="M10 16H46V46H10V16Z"
                  fill="#FFCC00"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 16L20 8H36L46 16"
                  fill="#FFCC00"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <rect x="16" y="24" width="24" height="2" fill="#000" />
                <rect x="16" y="28" width="20" height="2" fill="#000" />
                <rect x="16" y="32" width="24" height="2" fill="#000" />
                <rect x="16" y="36" width="18" height="2" fill="#000" />
                <path
                  d="M42 20L50 28V20H42Z"
                  fill="#FFCC00"
                  stroke="#000"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              My Documents
            </span>
          </div>

          {/* Recycle Bin Icon */}
          <div
            className="flex flex-col items-center w-20 text-center text-white cursor-pointer group"
            onDoubleClick={() => setActiveWindow("recycle-bin")}
          >
            <div className="w-14 h-14 mb-1 flex items-center justify-center relative">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                className="transition-transform group-hover:scale-110"
              >
                <path
                  d="M14 20H42V44H14V20Z"
                  fill="#C0C0C0"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M18 16H38V20H18V16Z"
                  fill="#808080"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <rect x="26" y="12" width="4" height="4" fill="#000" />
                <rect x="20" y="24" width="16" height="12" fill="#FFFFFF" stroke="#000" />
                <rect x="24" y="28" width="8" height="1" fill="#000" />
                <rect x="24" y="32" width="8" height="1" fill="#000" />
                <path
                  d="M28 16L32 12L36 16"
                  stroke="#000"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-xs bg-blue-700 px-1 group-hover:bg-blue-800">
              Recycle Bin
            </span>
          </div>
        </div>

        {/* Auth Window */}
        {activeWindow === "auth" && (
          <div 
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 100 }}
          >
            <div className="border-2 border-gray-400 bg-gray-300 w-full max-w-md shadow-lg">
              <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  <span className="font-bold">Arbitrage-OS {type === "login" ? "Login" : "Register"}</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">_</span>
                  </div>
                  <div className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
                    <span className="text-xs">□</span>
                  </div>
                  <div
                    className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                    onClick={() => setActiveWindow("")}
                  >
                    <span className="text-xs">×</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-200">
                <div className="border-2 border-gray-400 bg-white p-4 space-y-4">
                  {/* Debug: Using MockAuthPageBase instead of real one */}
                  <h2 className="text-xl font-bold mb-4 text-center">
                    {type === "login" ? "Sign In" : "Sign Up"}
                  </h2>
                  
                  <MockAuthPageBase type={type} />
                  
                  <p className="text-xs text-center text-gray-600">
                    check email for code if having trouble logging in after signup
                  </p>
                  
                  <div className="text-center mt-4 pt-4 border-t border-gray-300">
                    {type === "login" ? (
                      <p className="text-sm">
                        Do not have an account?{" "}
                        <button 
                          onClick={() => alert("Navigate to /register")}
                          className="text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p className="text-sm">
                        Already have an account?{" "}
                        <button 
                          onClick={() => alert("Navigate to /login")}
                          className="text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <button 
                    className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 cursor-pointer"
                    onClick={() => setActiveWindow("")}
                  >
                    Cancel
                  </button>
                  <div className="text-xs text-gray-600">Arbitrage-OS v1.0</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Windows */}
        {activeWindow === "my-computer" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                <span className="font-bold">My Computer</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200 grid grid-cols-3 gap-4">
              {["Local Disk (C:)", "Local Disk (D:)", "CD-ROM (E:)", "Network", "Control Panel", "Printers"].map(
                (item) => (
                  <div key={item} className="flex flex-col items-center cursor-pointer">
                    <div className="w-12 h-12 bg-blue-700 flex items-center justify-center mb-1 hover:bg-blue-800">
                      <HardDrive className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-center">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Documents Window */}
        {activeWindow === "documents" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <File className="w-4 h-4 mr-2" />
                <span className="font-bold">My Documents</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200">
              <p className="text-sm">No documents found.</p>
            </div>
          </div>
        )}

        {/* Recycle Bin Window */}
        {activeWindow === "recycle-bin" && (
          <div className="absolute left-1/4 top-1/4 w-96 border-2 border-gray-400 bg-gray-300 shadow-lg">
            <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
              <div className="flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="font-bold">Recycle Bin</span>
              </div>
              <div className="flex space-x-1">
                <div
                  className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
                  onClick={() => setActiveWindow("")}
                >
                  <span className="text-xs">×</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-200">
              <p className="text-sm">Recycle Bin is empty.</p>
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div className="h-10 bg-gray-400 border-t-2 border-gray-300 flex items-center px-2 z-40">
        <button className="h-8 px-3 bg-gradient-to-b from-blue-700 to-blue-500 text-white font-bold flex items-center hover:from-blue-800 hover:to-blue-600">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          Start
        </button>

        <div className="flex-1 flex space-x-1 mx-2">
          {activeWindow === "auth" && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              Arbitrage-OS {type === "login" ? "Login" : "Register"}
            </button>
          )}
          {activeWindow === "my-computer" && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <HardDrive className="w-4 h-4 mr-1" />
              My Computer
            </button>
          )}
          {activeWindow === "documents" && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <File className="w-4 h-4 mr-1" />
              My Documents
            </button>
          )}
          {activeWindow === "recycle-bin" && (
            <button className="h-8 px-3 bg-gradient-to-b from-gray-300 to-gray-200 border-2 border-gray-400 font-bold flex items-center">
              <Trash2 className="w-4 h-4 mr-1" />
              Recycle Bin
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <div className="h-8 px-2 bg-gray-300 border-2 border-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}