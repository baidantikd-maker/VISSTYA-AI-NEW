import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Verify from "@/pages/Verify";
import Processing from "@/pages/Processing";
import Report from "@/pages/Report";
import History from "@/pages/History";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Share from "@/pages/Share";
import Login from "@/pages/Login";
import { AnimatePresence, motion } from "framer-motion";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function AnimatedRoutes() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/login"} component={Login} />
          <Route path={"/auth/callback"} component={Login} />
          <Route path={"/verify"} component={Verify} />
          <Route path={"/verify/processing"} component={Processing} />
          <Route path={"/report/:id"} component={Report} />
          <Route path={"/history"} component={History} />
          <Route path={"/dashboard"} component={Dashboard} />
          <Route path={"/settings"} component={Settings} />
          <Route path={"/share/:token"} component={Share} />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <AnimatedRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
