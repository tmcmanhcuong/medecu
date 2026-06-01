import React from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";

// Layout & Components
import Layout from "../layouts/Footer";
import Sidebar from "../components/layout/SideBar";
import RequireAuth from "../components/RequireAuth";

// Pages
import HomePage from "../pages/HomePage";
import LandingPage from "../pages/LandingPage";
import SigninPage from "../pages/Auth/SigninPage";
import SignupPage from "../pages/Auth/SignupPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPassPage";
import RoleSelection from "../pages/Home/SelectRole";
import DetailsUser from "../pages/Home/DetailsUser";
import PersonalizedExercises from "../pages/PersonalizedExercises";
import Settings from "../pages/SettingsPage";
import Dashboard from "../pages/Home/Dashboard";
import CORSTestPage from "../pages/CORSTestPage";
import AITestPage from "../pages/AITestPage";
import WorkspacePage from "../pages/WorkspacePage";

export default function AppRouter() {
  const navigate = useNavigate();

  const handleChatClick = (chatModeId) => {
    // Navigate to dashboard instead of separate chatbot page
    navigate('/dashboard');
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Public Routes */}
      <Route path="/cors-test" element={<CORSTestPage />} />
      <Route path="/ai-test" element={<AITestPage />} />
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<Sidebar />}>
          <Route path="/home" element={<HomePage onChatClick={handleChatClick} />} />
          <Route path="/exercises" element={<PersonalizedExercises />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/workspace/:notebookId" element={<WorkspacePage />} />
        </Route>

        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/details-user" element={<DetailsUser />} />
      </Route>
    </Routes>
  );
}
