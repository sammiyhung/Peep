import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Eager load critical routes
import { Home } from "@/_root/pages";
import AuthLayout from "./_auth/AuthLayout";
import PublicLayout from "./_auth/PublicLayout";
import RootLayout from "./_root/RootLayout";
import SignupForm from "@/_auth/forms/SignupForm";
import SigninForm from "@/_auth/forms/SigninForm";
import { Loader } from "@/components/shared";

// Lazy load non-critical routes
const Explore = lazy(() => import("@/_root/pages/Explore"));
const Saved = lazy(() => import("@/_root/pages/Saved"));
const CreatePost = lazy(() => import("@/_root/pages/CreatePost"));
const Profile = lazy(() => import("@/_root/pages/Profile"));
const EditPost = lazy(() => import("@/_root/pages/EditPost"));
const PostDetails = lazy(() => import("@/_root/pages/PostDetails"));
const UpdateProfile = lazy(() => import("@/_root/pages/UpdateProfile"));
const AllUsers = lazy(() => import("@/_root/pages/AllUsers"));
const Chat = lazy(() => import("@/_root/pages/Chat"));
const ChatList = lazy(() => import("@/_root/pages/ChatList"));
const Circles = lazy(() => import("@/_root/pages/Circles"));
const CreateCircle = lazy(() => import("@/_root/pages/CreateCircle"));
const CircleDetails = lazy(() => import("@/_root/pages/CircleDetails"));
const CreateCirclePost = lazy(() => import("@/_root/pages/CreateCirclePost"));
const Vibes = lazy(() => import("@/_root/pages/Vibes"));
const Notifications = lazy(() => import("@/_root/pages/Notifications"));
const Settings = lazy(() => import("@/_root/pages/Settings"));
const VerifyEmail = lazy(() => import("@/_auth/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/_auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/_auth/pages/ResetPassword"));
const EmailVerificationPrompt = lazy(() => import("@/_auth/pages/EmailVerificationPrompt"));
import { Toaster } from "@/components/ui/toaster";
import { VideoProvider } from "@/context/VideoContext";

import "./globals.css";

const App = () => {
  return (
    <VideoProvider>
      <main className="flex h-screen">
        <Suspense fallback={<div className="flex-center w-full h-full"><Loader /></div>}>
          <Routes>
          {/* public routes */}
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<SigninForm />} />
            <Route path="/sign-up" element={<SignupForm />} />
            <Route path="/forgot-password" element={<Suspense fallback={<Loader />}><ForgotPassword /></Suspense>} />
          </Route>

          {/* Email verification and password reset (accessible to all, centered layout) */}
          <Route element={<PublicLayout />}>
            <Route path="/verify-email" element={<Suspense fallback={<Loader />}><VerifyEmail /></Suspense>} />
            <Route path="/verify-email-prompt" element={<Suspense fallback={<Loader />}><EmailVerificationPrompt /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<Loader />}><ResetPassword /></Suspense>} />
          </Route>

          {/* private routes */}
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="/explore" element={<Suspense fallback={<Loader />}><Explore /></Suspense>} />
            <Route path="/saved" element={<Suspense fallback={<Loader />}><Saved /></Suspense>} />
            <Route path="/vibes" element={<Suspense fallback={<Loader />}><Vibes /></Suspense>} />
            <Route path="/notifications" element={<Suspense fallback={<Loader />}><Notifications /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<Loader />}><Settings /></Suspense>} />
            <Route path="/chats" element={<Suspense fallback={<Loader />}><ChatList /></Suspense>} />
            <Route path="/chat/:userId" element={<Suspense fallback={<Loader />}><Chat /></Suspense>} />
            <Route path="/all-users" element={<Suspense fallback={<Loader />}><AllUsers /></Suspense>} />
            <Route path="/circles" element={<Suspense fallback={<Loader />}><Circles /></Suspense>} />
            <Route path="/circles/create" element={<Suspense fallback={<Loader />}><CreateCircle /></Suspense>} />
            <Route path="/circles/:id" element={<Suspense fallback={<Loader />}><CircleDetails /></Suspense>} />
            <Route path="/circles/:circleId/create-post" element={<Suspense fallback={<Loader />}><CreateCirclePost /></Suspense>} />
            <Route path="/create-post" element={<Suspense fallback={<Loader />}><CreatePost /></Suspense>} />
            <Route path="/update-post/:id" element={<Suspense fallback={<Loader />}><EditPost /></Suspense>} />
            <Route path="/posts/:id" element={<Suspense fallback={<Loader />}><PostDetails /></Suspense>} />
            <Route path="/profile/:id/*" element={<Suspense fallback={<Loader />}><Profile /></Suspense>} />
            <Route path="/update-profile/:id" element={<Suspense fallback={<Loader />}><UpdateProfile /></Suspense>} />
          </Route>
          </Routes>
        </Suspense>

        <Toaster />
      </main>
    </VideoProvider>
  );
};

export default App;
