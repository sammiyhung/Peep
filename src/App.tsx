import { Routes, Route } from "react-router-dom";

import {
  Home,
  Explore,
  Saved,
  CreatePost,
  Profile,
  EditPost,
  PostDetails,
  UpdateProfile,
  AllUsers,
  Chat,
  ChatList,
  Circles,
  CreateCircle,
  CircleDetails,
  CreateCirclePost,
} from "@/_root/pages";
import AuthLayout from "./_auth/AuthLayout";
import PublicLayout from "./_auth/PublicLayout";
import RootLayout from "./_root/RootLayout";
import SignupForm from "@/_auth/forms/SignupForm";
import SigninForm from "@/_auth/forms/SigninForm";
import VerifyEmail from "@/_auth/pages/VerifyEmail";
import ForgotPassword from "@/_auth/pages/ForgotPassword";
import ResetPassword from "@/_auth/pages/ResetPassword";
import EmailVerificationPrompt from "@/_auth/pages/EmailVerificationPrompt";
import { Toaster } from "@/components/ui/toaster";
import { VideoProvider } from "@/context/VideoContext";

import "./globals.css";

const App = () => {
  return (
    <VideoProvider>
      <main className="flex h-screen">
        <Routes>
        {/* public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SigninForm />} />
          <Route path="/sign-up" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Email verification and password reset (accessible to all, centered layout) */}
        <Route element={<PublicLayout />}>
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-prompt" element={<EmailVerificationPrompt />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* private routes */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/circles" element={<Circles />} />
          <Route path="/circles/create" element={<CreateCircle />} />
          <Route path="/circles/:id" element={<CircleDetails />} />
          <Route path="/circles/:circleId/create-post" element={<CreateCirclePost />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />
          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
        </Routes>

        <Toaster />
      </main>
    </VideoProvider>
  );
};

export default App;
