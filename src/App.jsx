import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';

import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Bandes from '@/pages/Bandes';
import Provenderie from '@/pages/Provenderie';
import Comptabilite from '@/pages/Comptabilite';
import Equipes from '@/pages/Equipes';
import Medicaments from '@/pages/Medicaments';
import Fournisseurs from '@/pages/Fournisseurs';
import Clients from '@/pages/Clients';
import MaBoutique from '@/pages/MaBoutique';
import BandeDetail from '@/pages/BandeDetail';
import Parametres from '@/pages/Parametres';
import AssistantIA from '@/pages/AssistantIA';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bandes" element={<Bandes />} />
          <Route path="/provenderie" element={<Provenderie />} />
          <Route path="/medicaments" element={<Medicaments />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/comptabilite" element={<Comptabilite />} />
          <Route path="/fournisseurs" element={<Fournisseurs />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/ma-boutique" element={<MaBoutique />} />
          <Route path="/bandes/:id" element={<BandeDetail />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/assistant-ia" element={<AssistantIA />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </LanguageProvider>
  )
}

export default App