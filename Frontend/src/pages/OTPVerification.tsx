import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  const [otp, setOtp] = React.useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = React.useState(false);
  const [timer, setTimer] = React.useState(59);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.value !== '' && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      if (e.currentTarget.previousSibling) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success('Code verified successfully.');
    navigate('/reset-password', { state: { email } });
  };

  const handleResend = () => {
    setTimer(59);
    toast.info('A fresh verification code has been dispatched.');
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
            Verify Email
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-semibold max-w-xs">
            We sent a verification code to <span className="text-slate-600 font-bold">{email}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-enterprise-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2.5">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  className="w-11 h-11 border border-slate-200 rounded-xl text-center font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 text-slate-800 bg-slate-50/30"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold py-2.5 rounded-xl h-11"
              loading={loading}
            >
              Verify Code
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Didn't receive code?</span>
            {timer > 0 ? (
              <span className="text-slate-400">Resend in {timer}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-emerald-600 hover:underline focus:outline-none"
              >
                Resend code
              </button>
            )}
          </div>

          <div className="mt-5 text-center border-t border-slate-100 pt-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to forgot page
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
