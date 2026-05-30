import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Eye, EyeOff, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation must match'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetSchemaType = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your account';

  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetSchemaType>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (_data: ResetSchemaType) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success('Password updated successfully. Please sign in.');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-50/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6 z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-enterprise-md mb-4">
            <Boxes className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Define New Password
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-semibold max-w-xs">
            Set a strong security key for <span className="text-slate-600 font-bold">{email}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-enterprise-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center">
                <Lock className="h-3.5 w-3.5 mr-1 text-slate-400" /> New Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[10px] font-bold text-red-500">{errors.password.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center">
                <Lock className="h-3.5 w-3.5 mr-1 text-slate-400" /> Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400' : ''}
              />
              {errors.confirmPassword && (
                <span className="text-[10px] font-bold text-red-500">{errors.confirmPassword.message}</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold py-2.5 rounded-xl h-11"
              loading={loading}
            >
              Reset Security Key
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
