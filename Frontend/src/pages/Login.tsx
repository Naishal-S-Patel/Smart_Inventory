import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, Boxes, BarChart3, Warehouse, BrainCircuit, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInventoryStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: BrainCircuit, title: 'AI Demand Forecasting', desc: 'Prophet & XGBoost models predict demand with 94%+ accuracy' },
  { icon: Warehouse, title: 'Multi-Warehouse Management', desc: 'Real-time inventory tracking across 5+ distribution centers' },
  { icon: BarChart3, title: 'Predictive Analytics', desc: 'Revenue trends, dead stock analysis, and turnover optimization' },
];

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'a.mercer@smartinventory.com' },
  { role: 'Manager', email: 's.jenkins@smartinventory.com' },
  { role: 'Staff', email: 'm.torres@smartinventory.com' },
  { role: 'Analyst', email: 'c.oswald@smartinventory.com' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useInventoryStore((state) => state.login);
  const currentUser = useInventoryStore((state) => state.currentUser);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'a.mercer@smartinventory.com',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-900 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/8 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">SmartInventory</span>
              <span className="block text-emerald-400 text-[10px] font-semibold tracking-widest uppercase">AI Prediction Suite</span>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-8 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Intelligent Inventory.
                <br />
                <span className="text-gradient-emerald">Predictive Precision.</span>
              </h1>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md">
                Enterprise-grade supply chain management powered by machine learning. Forecast demand, optimize stock levels, and eliminate waste across your entire distribution network.
              </p>
            </motion.div>

            {/* Features */}
            <div className="space-y-4">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <feature.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex gap-8"
          >
            {[
              { value: '500+', label: 'Products Tracked' },
              { value: '5', label: 'Warehouses' },
              { value: '94.8%', label: 'Forecast Accuracy' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-extrabold text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white lg:w-[45%]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">SmartInventory</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email address
              </label>
              <Input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className={errors.email ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400' : ''}
              />
              {errors.email && (
                <p className="text-[11px] font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" /> Password
                </span>
                <Link to="/forgot-password" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </Link>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600">Remember me</span>
            </label>

            {/* Submit */}
            <Button type="submit" loading={loading} className="w-full h-11 text-sm font-semibold" size="lg">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Demo Accounts</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setValue('email', account.email);
                    setValue('password', 'password123');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-emerald-700">{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
