"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import {
  LoginForm,
  ForgotPasswordForm,
  SocialButton,
  AuthDivider,
} from "@/components/ui/AuthForms";
import { useAuth } from "@/contexts/AuthContext";

type AuthView = "login" | "forgot-password";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (data: {
    email: string;
    password: string;
    remember: boolean;
  }) => {
    setError(null);
    setIsLoading(true);
    const { error } = await signInWithEmail(data.email, data.password);
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      onClose();
    }
  };

  const handleResetPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const switchView = (newView: AuthView) => {
    setError(null);
    setView(newView);
  };

  const getTitle = () => {
    switch (view) {
      case "login":
        return "Welcome back";
      case "forgot-password":
        return "Reset password";
    }
  };

  const getDescription = () => {
    switch (view) {
      case "login":
        return "Sign in to your account to continue";
      case "forgot-password":
        return "Enter your email to reset your password";
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="pt-2">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-xl flex items-center justify-center">
            <span className="text-accent font-bold text-xl">H</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            {getTitle()}
          </h2>
          <p className="text-sm text-text-muted mt-1">{getDescription()}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {view === "login" && (
              <>
                <SocialButton
                  provider="google"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                />
                <AuthDivider />
                <LoginForm
                  onSubmit={handleEmailSignIn}
                  onForgotPassword={() => switchView("forgot-password")}
                  isLoading={isLoading}
                />
              </>
            )}

            {view === "forgot-password" && (
              <ForgotPasswordForm
                onSubmit={handleResetPassword}
                onBack={() => switchView("login")}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}
