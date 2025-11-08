import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader } from '@/components/shared';
import { api } from '@/lib/api/config';

const ForgotPasswordValidation = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof ForgotPasswordValidation>) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', values);
      
      setEmailSent(true);
      toast({
        title: 'Email sent!',
        description: response.data.message,
        variant: 'success' as any,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full flex-center flex-col">
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
              <h2 className="h3-bold text-light-1">Check Your Email 📧</h2>
              <p className="text-light-3 base-regular max-w-sm">
                If an account exists with the email you provided, you'll receive a password reset link shortly.
              </p>
              <p className="text-light-4 small-regular">
                The link will expire in 1 hour for security reasons.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full mt-6">
              <Link to="/sign-in" className="w-full">
                <Button className="shad-button_primary w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-500 small-semibold hover:underline"
              >
                Try another email
              </button>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-center flex-col">
        <Form {...form}>
          <div className="flex flex-col items-center space-y-6">
            <img 
              src="/assets/images/logo.png" 
              alt="Peep" 
              className="w-24 h-24 object-contain"
            />

            <div className="text-center space-y-2">
              <h2 className="h3-bold md:h2-bold text-light-1">Forgot Password?</h2>
              <p className="text-light-3 small-medium md:base-regular">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-5 w-full"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4" />
                        <Input
                          type="email"
                          className="shad-input pl-11"
                          placeholder="your.email@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="shad-button_primary" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex-center gap-2">
                    <Loader /> Sending...
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <Link to="/sign-in" className="w-full">
                <Button type="button" className="shad-button_ghost w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </form>
          </div>
        </Form>
    </div>
  );
};

export default ForgotPassword;
