import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReservationProvider } from "@/contexts/ReservationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import ReservationPage from "@/pages/ReservationPage";
import ShopPage from "@/pages/ShopPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <ReservationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/reservation" element={<ReservationPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ReservationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
