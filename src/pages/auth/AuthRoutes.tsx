import type { RouteObject } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";
import VerifyOtpPage from "@/features/auth/VerifyOtpPage";
import SetPasswordPage from "@/features/auth/SetPasswordPage";
import AuthLayout from "@/layouts/AuthLayout";
import { ROUTES } from "@/constants/routes";

const AuthRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
      { path: ROUTES.verifyOtp, element: <VerifyOtpPage /> },
      { path: ROUTES.setPassword, element: <SetPasswordPage /> },
    ],
  },
];

export default AuthRoutes;
