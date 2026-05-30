import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  BrainCircuit,
  Warehouse,
  LineChart,
  ArrowRight,
  Play,
  CheckCircle2,
  ArrowRightLeft,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Zap,
  Layers,
  ArrowDownToLine,
} from 'lucide-react';
import { useInventoryStore } from '@/store';

export default function Landing() {
  const currentUser = useInventoryStore((state) => state.currentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'admin' | 'manager' | 'staff' | 'analyst'>('admin');

  // Role Features for Interactive Section
  const roleWorkspaces = {
    admin: {
      title: 'Enterprise Administration Workspace',
      badge: 'Admin Panel',
      description: 'Full oversight of system configurations, user directory controls, security settings, and forensic audit logs.',
      features: [
        'Manage organizational roles and RBAC permission mappings',
        'Inspect immutable system-wide audit logs for security compliance',
        'Configure external API connections and webhooks',
        'Monitor active system sessions and database read/write latency'
      ],
      color: 'from-emerald-500/25 to-teal-500/5',
      accentColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      mockView: (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 font-mono text-[11px] text-slate-300 space-y-3.5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> SYSTEM LOGS (AUDIT)</span>
            <span className="text-[9px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded">ONLINE</span>
          </div>
          <div className="space-y-1.5 leading-relaxed">
            <p className="text-slate-500">[2026-05-29 22:45:11] <span className="text-slate-300">USER_LOGIN</span> - alex.mercer@smartinv.com from IP 192.168.1.45</p>
            <p className="text-slate-500">[2026-05-29 22:46:04] <span className="text-emerald-400 font-medium">ROLE_SWITCH</span> - Sarah Jenkins switched role to MANAGER</p>
            <p className="text-slate-500">[2026-05-29 22:47:33] <span className="text-amber-400 font-medium">CONFIG_WRITE</span> - SMTP Mailserver settings updated by Admin</p>
            <p className="text-slate-500">[2026-05-29 22:49:01] <span className="text-slate-300">USER_CREATE</span> - Created user profile (c.oswald@analyst.com)</p>
          </div>
          <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Showing 4 of 1,289 entries</span>
            <span className="text-emerald-400 cursor-pointer hover:underline">Download CSV &rarr;</span>
          </div>
        </div>
      )
    },
    manager: {
      title: 'Supply Chain Operations Manager Suite',
      badge: 'Manager Console',
      description: 'Control procurement, evaluate supplier performance reliability, review low-stock alerts, and authorize purchase orders.',
      features: [
        'Automated reorder suggestion engine mapping safety stock boundaries',
        'Purchase Order lifecycle tracking with one-click approval workflows',
        'Supplier scorecard analytics mapping lead time vs reliability accuracy',
        'Real-time threshold alerting thresholds (Low stock, expiry anomalies)'
      ],
      color: 'from-blue-500/25 to-indigo-500/5',
      accentColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      mockView: (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-slate-300 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5"><ArrowDownToLine className="h-3.5 w-3.5" /> REORDER ALERTS</span>
            <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full">CRITICAL</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <div>
                <p className="text-[11px] font-bold">Wireless Headphones V2</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Stock: 12 units (Reorder Point: 50)</p>
              </div>
              <button className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded transition-colors">
                Draft PO
              </button>
            </div>
            <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <div>
                <p className="text-[11px] font-bold">Ergonomic Office Chair</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Stock: 8 units (Reorder Point: 15)</p>
              </div>
              <button className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded transition-colors">
                Draft PO
              </button>
            </div>
          </div>
        </div>
      )
    },
    staff: {
      title: 'Warehouse Logistics & Fulfillment Hub',
      badge: 'Warehouse Terminal',
      description: 'Streamline warehouse-to-warehouse stock transfers, register inbound shipments, and maintain real-time shelf accuracy.',
      features: [
        'Multi-facility stock transfer request and routing workflows',
        'Inbound PO receipt checklists with automatic inventory balance integration',
        'Shelf location tracking mapping product storage locations',
        'Transaction logging detailing every physical item movement'
      ],
      color: 'from-orange-500/25 to-amber-500/5',
      accentColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      mockView: (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-slate-300 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-orange-400 font-bold text-xs flex items-center gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5" /> INTER-WAREHOUSE TRANSFERS</span>
            <span className="text-[9px] bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded">2 ACTIVE</span>
          </div>
          <div className="space-y-2.5">
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between font-semibold">
                <span>TF-2026-004 (Liquid Coolers)</span>
                <span className="text-orange-400">In Transit</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>North Central Hub</span>
                <span>East Fulfillment Center</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    analyst: {
      title: 'AI Forecasting & Business Intelligence',
      badge: 'Forecasting Suite',
      description: 'Run deep predictive analysis, execute model training cycles, evaluate regression error margins, and generate executive reports.',
      features: [
        'Prophet & XGBoost forecasting models with customizable confidence intervals',
        'Interactive forecast visualization showing historical actuals vs predicted demand',
        'Forecasting model health indicators (RMSE, MAE, R-squared values)',
        'Comprehensive report generation across demand, inventory levels, and asset value'
      ],
      color: 'from-purple-500/25 to-pink-500/5',
      accentColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      mockView: (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 text-slate-300 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-purple-400 font-bold text-xs flex items-center gap-1.5"><LineChart className="h-3.5 w-3.5" /> MODEL HEALTH</span>
            <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1"><Sparkles className="h-3 w-3" /> PROPHET ENGINE</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">Forecast Accuracy</span>
              <span className="text-base font-extrabold text-white mt-1 block">94.82%</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">RMSE Error</span>
              <span className="text-base font-extrabold text-white mt-1 block">1.84</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between items-center px-1">
            <span>Last trained: Today, 14:24</span>
            <button className="text-[9px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
              Run Training <Zap className="h-2.5 w-2.5 fill-current" />
            </button>
          </div>
        </div>
      )
    }
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'AI Models', href: '#ai-models' },
    { name: 'Role Experience', href: '#roles' },
    { name: 'Metrics', href: '#metrics' }
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[550px] h-[550px] rounded-full bg-emerald-500/3 blur-[130px] pointer-events-none" />

      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 transition-all duration-300">
        <div className="mx-auto bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-3 md:px-6 flex items-center justify-between shadow-xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Boxes className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-[15px] tracking-tight leading-tight">SmartInventory</span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                AI Prediction Suite
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Button */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-150"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all duration-150 shadow-md shadow-emerald-500/10"
                >
                  Request Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-16 left-0 w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-50 md:hidden"
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  className="text-sm font-semibold text-slate-300 hover:text-white py-2"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-slate-800 my-1" />
              <div className="flex flex-col gap-3">
                {currentUser ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center text-sm font-semibold text-slate-300 py-2.5 hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold"
                    >
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase mb-6"
        >
          <Sparkles className="h-3 w-3 fill-emerald-400" /> Powered by Advanced Machine Learning
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl"
        >
          Supply Chain Intelligence.
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
            Predictive Demand Precision.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl"
        >
          Enterprise-grade inventory orchestration running Prophet and XGBoost forecast modeling. Predict stockouts, balance multi-warehouse supplies, and streamline procurement before costs accrue.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
        >
          {currentUser ? (
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all duration-200 w-full sm:w-auto"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all duration-200 w-full sm:w-auto"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <a
            href="#roles"
            onClick={(e) => handleScroll(e, '#roles')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-colors w-full sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Explore Role Workspaces
          </a>
        </motion.div>

        {/* Dashboard Visual Mock */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/40 p-1 sm:p-2 backdrop-blur-xl shadow-2xl relative"
        >
          {/* Glass Card Glowing Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl pointer-events-none" />
          <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-900 p-4 sm:p-6 text-left relative">
            
            {/* Visual Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-900 gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">Live Prediction System Active</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">Warehouse: All Hubs</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-1 rounded-md font-semibold">Model accuracy: 94.8%</span>
              </div>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              {/* Left KPI list */}
              <div className="space-y-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Predictive Waste Saved</p>
                  <p className="text-xl font-extrabold mt-1 text-white">$18,420</p>
                  <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-1.5">
                    +12.4% vs last period
                  </span>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Model Training Time</p>
                  <p className="text-xl font-extrabold mt-1 text-white">2.4s</p>
                  <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5 mt-1.5">
                    Prophet / XGBoost models
                  </span>
                </div>
              </div>

              {/* Center forecast preview chart */}
              <div className="md:col-span-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demand Curve Forecast</span>
                  <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-500">Predicted next 30 days</span>
                </div>
                
                {/* SVG Mock Chart */}
                <div className="flex-1 flex items-end justify-center pt-6 pb-2">
                  <svg className="w-full h-28" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Shaded Area Confidence band */}
                    <path
                      d="M0,25 Q15,22 30,16 Q45,21 60,11 Q75,15 90,6 L90,30 L0,30 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Confidence bound lines */}
                    <path
                      d="M0,23 Q15,19 30,13 Q45,18 60,8 Q75,12 90,3"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                    />
                    <path
                      d="M0,27 Q15,25 30,19 Q45,24 60,14 Q75,18 90,9"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                    />
                    {/* Actual trend line */}
                    <path
                      d="M0,25 Q15,22 30,16 Q45,21 60,11 Q75,15 90,6"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    {/* Dot on prediction point */}
                    <circle cx="90" cy="6" r="1" fill="#f97316" className="animate-ping" style={{ transformOrigin: '90px 6px' }} />
                    <circle cx="90" cy="6" r="0.75" fill="#f97316" />
                  </svg>
                </div>

                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>May 01</span>
                  <span>May 10</span>
                  <span>May 20</span>
                  <span>May 30 (Forecast)</span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-slate-900 bg-slate-950 relative z-10 scroll-mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Built for Scale. Engineered for Accuracy.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We replace guesswork with regression-backed prediction modeling. Get robust controls across every layer of inventory operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              {
                icon: BrainCircuit,
                title: 'AI Demand Predictions',
                desc: 'Dual Prophet and XGBoost forecast structures calculate seasonal trends, holidays, and localized demand curves.',
                color: 'group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10'
              },
              {
                icon: Warehouse,
                title: 'Multi-Warehouse Sync',
                desc: 'Real-time routing across multiple stocking points. Monitor capacities, calculate storage cost thresholds, and automate transfer logs.',
                color: 'group-hover:border-blue-500/30 group-hover:bg-blue-500/10'
              },
              {
                icon: LineChart,
                title: 'Predictive Analytics',
                desc: 'Audit dead stock value, evaluate inventory turnover metrics, and view real-time category distribution in premium charting layouts.',
                color: 'group-hover:border-purple-500/30 group-hover:bg-purple-500/10'
              },
              {
                icon: Zap,
                title: 'Procurement Pipelines',
                desc: 'Auto-compile Purchase Orders from forecast alerts. Keep tracks of approval states, delivery updates, and supplier scores.',
                color: 'group-hover:border-amber-500/30 group-hover:bg-amber-500/10'
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-slate-900 bg-slate-900/30 hover:border-slate-800/80 transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:text-white transition-all duration-200">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mt-4 text-white">{feature.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Comparison */}
      <section id="ai-models" className="py-24 px-6 border-t border-slate-900 bg-slate-900/20 relative z-10 scroll-mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold tracking-wider uppercase">
              <Sparkles className="h-3 w-3" /> Technical Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Dual-Engine Machine Learning Orchestrator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              SmartInventory evaluates inventory trends through two complementary mathematical models. The engine dynamically blends forecasts based on model error rates (RMSE) and SKU volatility.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 text-xs font-bold">1</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Facebook Prophet (Seasonality Core)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Excellent at mapping linear growth trends combined with multi-period seasonal dynamics (e.g. daily, weekly, and yearly holiday spikes).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 text-xs font-bold">2</div>
                <div>
                  <h4 className="text-xs font-bold text-white">XGBoost Engine (Non-linear Dynamics)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Specialized in detecting sudden trend anomalies, supplier fulfillment deviations, and short-term price variance impacts.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3 flex items-center justify-between">
              <span>Model Comparison</span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30">SKU: SI-1049</span>
            </h3>

            <div className="space-y-5 mt-6">
              {[
                { name: 'Prophet Forecasting Model', accuracy: '94.8%', latency: '0.45s', bias: 'Low', metric: 'Seasonality Best' },
                { name: 'XGBoost Gradient Booster', accuracy: '93.2%', latency: '0.12s', bias: 'Medium', metric: 'Anomaly Best' }
              ].map((model) => (
                <div key={model.name} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{model.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{model.metric}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-900">
                      <span className="block text-[8px] text-slate-500 uppercase font-semibold">Accuracy</span>
                      <span className="text-white font-bold mt-0.5 block">{model.accuracy}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-900">
                      <span className="block text-[8px] text-slate-500 uppercase font-semibold">Compute</span>
                      <span className="text-white font-bold mt-0.5 block">{model.latency}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-900">
                      <span className="block text-[8px] text-slate-500 uppercase font-semibold">Variance Bias</span>
                      <span className="text-white font-bold mt-0.5 block">{model.bias}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Role Workspaces */}
      <section id="roles" className="py-24 px-6 border-t border-slate-900 bg-slate-950 relative z-10 scroll-mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold tracking-wider uppercase">
              <Layers className="h-3.5 w-3.5" /> Granular Access Control
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Designed for the Whole Enterprise
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every organizational user gets a customized workspace matching their daily operational goals. Click through the roles below to explore their dashboard permissions.
            </p>
          </div>

          {/* Role Tabs Selector */}
          <div className="flex justify-center flex-wrap gap-2 md:gap-3 mt-12">
            {(Object.keys(roleWorkspaces) as Array<keyof typeof roleWorkspaces>).map((roleKey) => {
              const isActive = activeTab === roleKey;
              return (
                <button
                  key={roleKey}
                  onClick={() => setActiveTab(roleKey)}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-800 shadow-lg shadow-black/30'
                      : 'bg-transparent text-slate-500 border-slate-900 hover:text-slate-300 hover:border-slate-800'
                  }`}
                >
                  {roleWorkspaces[roleKey].badge}
                </button>
              );
            })}
          </div>

          {/* Role Workspace Showcase Pane */}
          <div className="mt-8 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative overflow-hidden">
            {/* Gradient glow depending on active role */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br ${roleWorkspaces[activeTab].color} blur-3xl opacity-40 pointer-events-none`} />

            <div className="space-y-5 relative z-10">
              <span className={`inline-block text-[10px] font-extrabold tracking-widest uppercase border px-2.5 py-0.5 rounded-full ${roleWorkspaces[activeTab].accentColor}`}>
                {roleWorkspaces[activeTab].badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {roleWorkspaces[activeTab].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {roleWorkspaces[activeTab].description}
              </p>

              <ul className="space-y-2 text-xs text-slate-300">
                {roleWorkspaces[activeTab].features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 w-full">
              {roleWorkspaces[activeTab].mockView}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-20 px-6 border-t border-slate-900 bg-slate-900/10 relative z-10 scroll-mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { value: '32.4%', label: 'Average Inventory Reduction', desc: 'Lower carry cost' },
            { value: '94.8%', label: 'Forecast Accuracy Rating', desc: 'Zero stockouts' },
            { value: '$1.2M', label: 'Client Capital Preserved', desc: 'Waste reduction' },
            { value: '12,000+', label: 'Automated Purchase Orders', desc: 'Frictionless ops' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="text-center space-y-2 border-r border-slate-900 last:border-r-0 pr-4 last:pr-0"
            >
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Onboarding Section */}
      <section className="py-24 px-6 border-t border-slate-900 bg-slate-950 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Optimize Your Distribution Network?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Integrate your databases, configure your warehouses, and start retraining ML models within minutes. Take complete command of inventory planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/10 transition-all duration-150 w-full sm:w-auto justify-center"
                >
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/10 transition-all duration-150 w-full sm:w-auto justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 text-xs sm:text-sm font-bold transition-all w-full sm:w-auto text-center"
                  >
                    Request Demo Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Boxes className="h-4.5 w-4.5 text-emerald-500" />
            <span className="font-semibold text-slate-300">SmartInventory Inc.</span>
            <span className="text-[10px] text-slate-600">© 2026. All rights reserved.</span>
          </div>

          <div className="flex gap-6 text-[11px] font-medium">
            <a href="#features" onClick={(e) => handleScroll(e, '#features')} className="hover:text-slate-300">Features</a>
            <a href="#ai-models" onClick={(e) => handleScroll(e, '#ai-models')} className="hover:text-slate-300">AI Modeling</a>
            <a href="#roles" onClick={(e) => handleScroll(e, '#roles')} className="hover:text-slate-300">RBAC Security</a>
            <Link to="/login" className="hover:text-slate-300">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
