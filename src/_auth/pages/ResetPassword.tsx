import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader } from '@/components/shared';
import { api } from '@/lib/api/config';

const ResetPasswordValidation = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get('token');

  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof ResetPasswordValidation>) => {
    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'Please request a new password reset link.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password: values.password,
      });

      setResetSuccess(true);
      toast({
        title: 'Password reset successful!',
        description: response.data.message,
        variant: 'success' as any,
      });

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/sign-in');
      }, 5000);
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full sm:w-420 flex-center flex-col px-5">
        <div className="w-full text-center space-y-6">
          <img 
            src="/assets/images/logo.png" 
            alt="Peep" 
            className="w-24 h-24 object-contain mx-auto"
          />
          <h2 className="h3-bold text-light-1">Invalid Reset Link</h2>
          <p className="text-light-3 base-regular">
            This password reset link is invalid or has expired.
          </p>
          <Button 
            onClick={() => navigate('/forgot-password')}
            className="shad-button_primary"
          >
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="w-full sm:w-420 flex-center flex-col px-5">
        <div className="w-full">
          <div className="flex flex-col items-center text-center space-y-6">
            <img 
              src="/assets/images/logo.png" 
              alt="Peep" 
              className="w-24 h-24 object-contain"
            />
            
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <CheckCircle2 className="w-16 h-16 text-green-500 relative" />
            </div>

            <div className="space-y-3">
              <h2 className="h3-bold text-light-1">Password Reset! 🎉</h2>
              <p className="text-light-3 base-regular max-w-sm">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <p className="text-light-4 small-regular">
                Redirecting to login in 5 seconds...
              </p>
            </div>

            <Button 
              onClick={() => navigate('/sign-in')}
              className="shad-button_primary w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-420 flex-center flex-col px-5">
      <div className="w-full">
        <Form {...form}>
          <div className="flex flex-col items-center space-y-6">
            <img 
              src="/assets/images/logo.png" 
              alt="Peep" 
              className="w-24 h-24 object-contain"
            />

            <div className="text-center space-y-2">
              <h2 className="h3-bold md:h2-bold text-light-1">Reset Password</h2>
              <p className="text-light-3 small-medium md:base-regular">
                Enter your new password below
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-5 w-full"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="shad-input pl-11 pr-11"
                          placeholder="Enter new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-light-4 hover:text-light-2"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-light-4 text-xs mt-1">
                      Must be at least 8 characters
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="shad-input pl-11 pr-11"
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-light-4 hover:text-light-2"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="shad-button_primary" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex-center gap-2">
                    <Loader /> Resetting...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
