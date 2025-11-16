import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmi';

import '@rainbow-me/rainbowkit/styles.css';

import Index from "@/Pages/Index";
import Projects from "@/Pages/Projects";
import ProjectDetail from "@/Pages/ProjectDetails";
import Dashboard from "@/Pages/Dashboard";
import CreateProject from "./Pages/CreateProject";
import LeaderboardPage from "./Pages/LeaderBoardPage";
import ProfilePage from "./Pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme()}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateProject />} />
              <Route path="/leaderboard" element={<LeaderboardPage/>} />
              <Route path="/profile" element={<ProfilePage/>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;