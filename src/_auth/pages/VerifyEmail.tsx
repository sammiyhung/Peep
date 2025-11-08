import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from '@/components/shared';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { api } from '@/lib/api/config';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple verification attempts
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await api.get(`/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Clear any pending verification email from localStorage
        localStorage.removeItem('pendingVerificationEmail');
        
        // Redirect to login page after 5 seconds
        setTimeout(() => {
          navigate('/sign-in');
        }, 5000);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Verification failed. The link may have expired.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="w-full sm:w-420 flex-center flex-col px-5">
      <div className="w-full">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <img 
            src="/assets/images/logo.png" 
            alt="Peep" 
            className="w-32 h-32 object-contain"
          />

          {/* Status Icon */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader />
              <h2 className="h3-bold text-light-1">Verifying your email...</h2>
              <p className="text-light-3 small-regular">Please wait a moment</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <CheckCircle2 className="w-20 h-20 text-green-500 relative" />
              </div>
              <h2 className="h3-bold text-light-1">Email Verified! 🎉</h2>
              <p className="text-light-3 base-regular max-w-sm">
                {message}
              </p>
              <p className="text-light-2 base-medium mt-4">
                You can now login with your credentials!
              </p>
              <p className="text-light-4 small-regular">
                Redirecting to login in 5 seconds...
              </p>
              <button
                onClick={() => navigate('/sign-in')}
                className="shad-button_primary mt-4 p-10"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                <XCircle className="w-20 h-20 text-red-500 relative" />
              </div>
              <h2 className="h3-bold text-light-1">Verification Failed</h2>
              <p className="text-light-3 base-regular max-w-sm">
                {message}
              </p>
              <div className="flex flex-col gap-3 w-full mt-4">
                <button
                  onClick={() => navigate('/sign-in')}
                  className="shad-button_primary"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/resend-verification')}
                  className="shad-button_ghost"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
