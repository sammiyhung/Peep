import { useState } from 'react';
import { Mail, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/config';

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified: boolean;
}

const EmailVerificationBanner = ({ userEmail, isVerified }: EmailVerificationBannerProps) => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(!isVerified);
  const [isResending, setIsResending] = useState(false);

  if (!isVisible || isVerified) return null;

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const response = await api.post('/api/auth/resend-verification');
      toast({
        title: 'Email sent!',
        description: response.data.message,
        variant: 'success' as any,
      });
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base">
                Verify your email address
              </p>
              <p className="text-white/90 text-xs sm:text-sm truncate">
                We sent a verification email to <span className="font-medium">{userEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <Mail className="w-4 h-4" />
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
