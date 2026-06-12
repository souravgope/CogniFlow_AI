import { Navigate, Route, Routes } from "react-router-dom";
import DiagramPage from "./pages/DiagramPage";
import DocsPage from "./pages/DocsPage";
import Home from "./pages/Home";
import LearningPage from "./pages/LearningPage";
import MistakeAnalyzerPage from "./pages/MistakeAnalyzerPage";
import SummarizerPage from "./pages/SummarizerPage";
import AssistantPage from "./pages/AssistantPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChatbotWidget from "./components/ChatbotWidget";
import { AuthProvider } from "./utils/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing & Auth Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Feature Workspace Routes */}
        <Route path="/diagram" element={<ProtectedRoute><DiagramPage /></ProtectedRoute>} />
        <Route path="/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
        <Route path="/summarizer" element={<ProtectedRoute><SummarizerPage /></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
        <Route path="/mistake-analyzer" element={<ProtectedRoute><MistakeAnalyzerPage /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
      <ChatbotWidget />
    </AuthProvider>
  );
}
