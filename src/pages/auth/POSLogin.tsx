import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wifi, Battery, HelpCircle, Settings, ChevronDown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const campusLocations = [
  { id: 1, name: "North Campus Main Hall" },
  { id: 2, name: "South Campus Cafeteria" },
  { id: 3, name: "East Wing Food Court" },
  { id: 4, name: "West Building Canteen" },
];

export default function POSLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCampus, setSelectedCampus] = useState(campusLocations[0]);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/pos");
  };

  const currentTime = new Date().toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Canteen POS</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Connected</span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">100%</span>
          </div>
          
          <span className="text-white font-medium">{currentTime}</span>
          
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-white mb-2">
            Simplified POS Staff Login
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Enter your email and password to sign in.
          </p>

          {/* Campus Location Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Active Campus Location
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCampusDropdown(!showCampusDropdown)}
                className="w-full h-14 px-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-left flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <span>{selectedCampus.name}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCampusDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCampusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-10">
                  {campusLocations.map((campus) => (
                    <button
                      key={campus.id}
                      type="button"
                      onClick={() => {
                        setSelectedCampus(campus);
                        setShowCampusDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                        selectedCampus.id === campus.id ? 'bg-slate-700 text-orange-400' : 'text-white'
                      }`}
                    >
                      {campus.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/80 rounded-2xl p-6 space-y-6 border border-slate-700/50">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl gap-2"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Database Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Cloud Sync Active</span>
            </div>
            <span className="text-slate-500 text-sm">© 2024 SCHOOL DISTRICT POS SYSTEMS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-slate-500 text-sm">System ID: POS-N042</span>
            <span className="text-slate-500 text-sm">v4.2.0-stable</span>
            
            <Button variant="outline" size="sm" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 bg-slate-800">
              <HelpCircle className="w-4 h-4" />
              Get Help
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 bg-slate-800">
              <Settings className="w-4 h-4" />
              Tech Support
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
