import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X, Zap, User } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

export const Header = () => {
  const location = useLocation();
  const { isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/projects", label: "Projects" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              PulsePool
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive(link.path) ? "default" : "ghost"}
                  className={isActive(link.path) ? "bg-gradient-primary" : ""}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            
            {/* Profile Link - Only show when connected */}
            {isConnected && (
              <Link to="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  className={isActive("/profile") ? "bg-gradient-primary" : ""}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
            )}
          </nav>

          {/* Desktop Connect Button */}
          <div className="hidden md:block">
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(link.path) ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive(link.path) ? "bg-gradient-primary" : ""
                    }`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              
              {/* Mobile Profile Link - Only show when connected */}
              {isConnected && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive("/profile") ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive("/profile") ? "bg-gradient-primary" : ""
                    }`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              )}
            </nav>
            <div className="mt-4 pt-4 border-t border-border/40">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};