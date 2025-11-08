import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader } from '@/components/shared';
import { api } from '@/lib/api/config';

const EmailVerificationPrompt = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Get email from location state or localStorage
  const userEmail = location.state?.email || localStorage.getItem('pendingVerificationEmail') || '';

  useEffect(() => {
    // Save email to localStorage for page refreshes
    if (location.state?.email) {
      localStorage.setItem('pendingVerificationEmail', location.state.email);
    }

    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, location.state?.email]);

  const handleResendEmail = async () => {
    if (!canResend || !userEmail) return;

    setIsResending(true);
    try {
      await api.post('/api/auth/resend-verification', { email: userEmail });
      
      toast({
        title: 'Email sent! 📧',
        description: 'Check your inbox for the verification link.',
        variant: 'success' as any,
      });

      setCanResend(false);
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/sign-in');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <img 
            src="/assets/images/logo.png" 
            alt="Peep" 
            className="w-24 h-24 object-contain"
          />
          
          {/* Animated Mail Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-dark-3 p-6 rounded-full border-2 border-primary-500">
              <Mail className="w-12 h-12 text-primary-500" />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-3">
            <h2 className="h3-bold md:h2-bold text-light-1">Verify Your Email 📧</h2>
            <p className="text-light-3 base-regular max-w-sm">
              We've sent a verification link to
            </p>
            <p className="text-primary-500 font-semibold break-all">
              {userEmail || 'your email'}
            </p>
            <p className="text-light-3 small-regular max-w-sm mt-4">
              Click the link in the email to verify your account and start using Peep!
            </p>
          </div>

          {/* Info Boxes */}
          <div className="w-full space-y-3 mt-6">
            <div className="bg-dark-3 border border-dark-4 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-light-2 small-semibold">Check your inbox</p>
                  <p className="text-light-4 small-regular">
                    The email should arrive within a few minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-dark-3 border border-dark-4 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-light-2 small-semibold">Check spam folder</p>
                  <p className="text-light-4 small-regular">
                    Sometimes emails end up in spam or junk
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full mt-8">
            <Button
              onClick={handleResendEmail}
              disabled={!canResend || isResending}
              className="shad-button_primary w-full"
            >
              {isResending ? (
                <div className="flex-center gap-2">
                  <Loader /> Sending...
                </div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canResend ? 'Resend Email' : `Resend in ${countdown}s`}
                </>
              )}
            </Button>

            <Button
              onClick={handleBackToLogin}
              variant="ghost"
              className="shad-button_ghost w-full"
            >
              Back to Login
            </Button>
          </div>

          {/* Helper Text */}
          <p className="text-light-4 small-regular mt-6">
            Already verified?{' '}
            <button
              onClick={handleBackToLogin}
              className="text-primary-500 hover:underline font-semibold"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPrompt;
