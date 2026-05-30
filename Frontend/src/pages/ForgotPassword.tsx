import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ChevronLeft, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotSchemaType = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotSchemaType>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotSchemaType) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success(`Verification code dispatched to ${data.email}`);
    navigate('/otp-verification', { state: { email: data.email } });
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
            Trouble signing in?
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-semibold max-w-xs">
            Provide your organizational email and we will send you a 6-digit verification code.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-enterprise-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center">
                <Mail className="h-3.5 w-3.5 mr-1 text-slate-400" /> Organizational email
              </label>
              <Input
                type="email"
                placeholder="a.mercer@smartinventory.com"
                {...register('email')}
                className={errors.email ? 'border-red-300 focus-visible:ring-red-200 focus-visible:border-red-400' : ''}
              />
              {errors.email && (
                <span className="text-[10px] font-bold text-red-500">{errors.email.message}</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold py-2.5 rounded-xl h-11"
              loading={loading}
            >
              Send Reset Code
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
