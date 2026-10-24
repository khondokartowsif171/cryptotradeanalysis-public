
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from '@/contexts/WalletContext';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { InstallAppProvider } from '@/components/InstallApp';

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <WalletProvider>
    <InstallAppProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </InstallAppProvider>
    </WalletProvider>
  </ThemeProvider>
);

export default App;
