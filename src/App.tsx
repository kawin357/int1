import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => {
    // Handle proxy errors globally - suppress React DevTools errors
    window.addEventListener('error', (event) => {
        if (event.message?.includes('disconnected port object') ||
            event.message?.includes('Extension context invalidated')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });

    // Suppress unhandled promise rejections from React DevTools
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('disconnected port object') ||
            event.reason?.message?.includes('Extension context invalidated')) {
            event.preventDefault();
            return false;
        }
    });

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Index />} />
                            {/* All routes default to Index page */}
                            <Route path="*" element={<Index />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;
