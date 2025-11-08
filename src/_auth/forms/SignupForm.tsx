import * as z from "zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api/config";

import { useCreateUserAccount, useSignInAccount } from "@/lib/react-query/queries";
import { SignupValidation } from "@/lib/validation";
import { useUserContext } from "@/context/AuthContext";
import useDebounce from "@/hooks/useDebounce";

const SignupForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  
  // Validation states
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState({ username: false, email: false });
  const [available, setAvailable] = useState({ username: true, email: true });
  const [passwordFocused, setPasswordFocused] = useState(false);

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });
  
  const watchedUsername = form.watch("username");
  const watchedEmail = form.watch("email");
  const watchedPassword = form.watch("password");
  const watchedName = form.watch("name");
  
  const debouncedUsername = useDebounce(watchedUsername, 500);
  const debouncedEmail = useDebounce(watchedEmail, 500);
  
  // Password strength rules
  const passwordRules = useMemo(() => ({
    length: watchedPassword?.length >= 8,
    upper: /[A-Z]/.test(watchedPassword || ""),
    lower: /[a-z]/.test(watchedPassword || ""),
    number: /[0-9]/.test(watchedPassword || ""),
    special: /[!@#$%^&*.]/.test(watchedPassword || "")
  }), [watchedPassword]);
  
  const passwordStrength = useMemo(() => {
    const score = Object.values(passwordRules).filter(Boolean).length;
    if (score === 5) return { label: "Strong", color: "text-green-500", bg: "bg-green-500" };
    if (score >= 3) return { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500" };
    return { label: "Weak", color: "text-red-500", bg: "bg-red-500" };
  }, [passwordRules]);
  
  const emailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail || "");
  }, [watchedEmail]);

  // Queries
  const { mutateAsync: createUserAccount, isLoading: isCreatingAccount } = useCreateUserAccount();
  const { mutateAsync: signInAccount, isLoading: isSigningInUser } = useSignInAccount();
  
  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 2) {
        setAvailable(prev => ({ ...prev, username: true }));
        return;
      }
      
      setChecking(prev => ({ ...prev, username: true }));
      try {
        const response = await api.get(`/api/auth/check-username?username=${debouncedUsername}`);
        setAvailable(prev => ({ ...prev, username: response.data.available }));
      } catch (error) {
        console.error("Error checking username:", error);
        setAvailable(prev => ({ ...prev, username: true }));
      } finally {
        setChecking(prev => ({ ...prev, username: false }));
      }
    };
    
    checkUsername();
  }, [debouncedUsername]);
  
  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !emailValid) {
        setAvailable(prev => ({ ...prev, email: true }));
        return;
      }
      
      setChecking(prev => ({ ...prev, email: true }));
      try {
        const response = await api.get(`/api/auth/check-email?email=${debouncedEmail}`);
        setAvailable(prev => ({ ...prev, email: response.data.available }));
      } catch (error) {
        console.error("Error checking email:", error);
        setAvailable(prev => ({ ...prev, email: true }));
      } finally {
        setChecking(prev => ({ ...prev, email: false }));
      }
    };
    
    checkEmail();
  }, [debouncedEmail, emailValid]);

  // Handler
  const handleSignup = async (user: z.infer<typeof SignupValidation>) => {
    try {
      const newUser = await createUserAccount(user);

      if (!newUser) {
        toast({ title: "Sign up failed. Please try again.", });
        
        return;
      }

      // Check if email verification is required
      if (newUser.emailVerificationRequired) {
        form.reset();
        
        toast({
          title: "Account created successfully! 🎉",
          description: "Please check your email to verify your account.",
          variant: "success" as any,
        });

        // Redirect to verification prompt page
        navigate('/verify-email-prompt', { 
          state: { email: newUser.email }
        });
        
        return;
      }

      // Legacy flow (if email verification is not required)
      const session = await signInAccount({
        email: user.email,
        password: user.password,
      });

      if (!session) {
        toast({ title: "Something went wrong. Please login your new account", });
        
        navigate("/sign-in");
        
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        
        toast({
          title: "Account created successfully! 🎉",
          description: "Welcome to Peep!",
          variant: "success" as any,
        });

        navigate("/");
      } else {
        toast({ title: "Login failed. Please try again.", });
        
        return;
      }
    } catch (error: any) {
      console.log({ error });
      
      // Show error message from server
      toast({
        title: "Sign up failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <div className="w-full flex-center flex-col pt-40">
        <img src="/assets/images/logo.png" alt="logo" className="mb-4" />

        <h2 className="h3-bold md:h2-bold">
          Create a new account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          To use Peeps, Please enter your details
        </p>

        <form
          onSubmit={form.handleSubmit(handleSignup)}
          className="flex flex-col gap-5 w-full mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Full Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="text" className="shad-input pr-10" {...field} />
                    {watchedName && watchedName.length >= 2 && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Username *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="text" className="shad-input pr-10" {...field} />
                    {checking.username && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4 animate-spin" />
                    )}
                    {!checking.username && watchedUsername && watchedUsername.length >= 2 && available.username && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                    {!checking.username && watchedUsername && watchedUsername.length >= 2 && !available.username && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {!available.username && watchedUsername && watchedUsername.length >= 2 && (
                  <p className="text-xs text-red-500 mt-1">Username is already taken</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type="email" className="shad-input pr-10" {...field} />
                    {checking.email && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-4 animate-spin" />
                    )}
                    {!checking.email && watchedEmail && emailValid && available.email && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                    {!checking.email && watchedEmail && emailValid && !available.email && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {!available.email && watchedEmail && emailValid && (
                  <p className="text-xs text-red-500 mt-1">Email is already registered</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      className="shad-input pr-10" 
                      {...field}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
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
                
                {/* Password Strength Indicator */}
                {watchedPassword && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-light-3">Password Strength:</span>
                      <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            Object.values(passwordRules).filter(Boolean).length >= level
                              ? passwordStrength.bg
                              : 'bg-dark-4'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Password Requirements */}
                {(passwordFocused || watchedPassword) && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-light-3 mb-2">Password must contain:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {passwordRules.length ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-light-4" />
                        )}
                        <span className={`text-xs ${passwordRules.length ? 'text-green-500' : 'text-light-4'}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRules.upper ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-light-4" />
                        )}
                        <span className={`text-xs ${passwordRules.upper ? 'text-green-500' : 'text-light-4'}`}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRules.lower ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-light-4" />
                        )}
                        <span className={`text-xs ${passwordRules.lower ? 'text-green-500' : 'text-light-4'}`}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRules.number ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-light-4" />
                        )}
                        <span className={`text-xs ${passwordRules.number ? 'text-green-500' : 'text-light-4'}`}>
                          One number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRules.special ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-light-4" />
                        )}
                        <span className={`text-xs ${passwordRules.special ? 'text-green-500' : 'text-light-4'}`}>
                          One special character (!@#$%^&*.)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary">
            {isCreatingAccount || isSigningInUser || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2 mb-4">
            Already have an account?
            <Link
              to="/sign-in"
              className="text-primary-500 text-small-semibold ml-1">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignupForm;
