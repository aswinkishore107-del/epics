import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AlertProvider } from './context/AlertContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleGuard } from './components/common/RoleGuard';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { GlobalEmergencyModal } from './components/common/GlobalEmergencyModal';
import { SimulatorDrawer } from './components/simulation/SimulatorDrawer';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

// Elderly Pages
import { ElderlyDashboard } from './pages/elderly/ElderlyDashboard';
import { ElderlyHealthPage } from './pages/elderly/ElderlyHealthPage';
import { ElderlyECGPage } from './pages/elderly/ElderlyECGPage';
import { ElderlyMedicationsPage } from './pages/elderly/ElderlyMedicationsPage';
import { ElderlyRemindersPage } from './pages/elderly/ElderlyRemindersPage';
import { ElderlyWellnessPage } from './pages/elderly/ElderlyWellnessPage';
import { ElderlyVoicePage } from './pages/elderly/ElderlyVoicePage';
import { ElderlyEntertainmentPage } from './pages/elderly/ElderlyEntertainmentPage';
import { ElderlyEmergencyPage } from './pages/elderly/ElderlyEmergencyPage';
import { ElderlyMessagesPage } from './pages/elderly/ElderlyMessagesPage';
import { ElderlyCommunityPage } from './pages/elderly/ElderlyCommunityPage';
import { ElderlyDevicePage } from './pages/elderly/ElderlyDevicePage';

// Caregiver Pages
import { CaregiverDashboard } from './pages/caregiver/CaregiverDashboard';
import { CaregiverPatientsPage } from './pages/caregiver/CaregiverPatientsPage';
import { CaregiverAlertsPage } from './pages/caregiver/CaregiverAlertsPage';
import { CaregiverMedicationsPage } from './pages/caregiver/CaregiverMedicationsPage';
import { CaregiverSettingsPage } from './pages/caregiver/CaregiverSettingsPage';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatientDetailPage } from './pages/doctor/DoctorPatientDetailPage';
import { DoctorReportsPage } from './pages/doctor/DoctorReportsPage';
import { DoctorNotesPage } from './pages/doctor/DoctorNotesPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Dashboard App Shell Layout
const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
      <GlobalEmergencyModal />
      <SimulatorDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AlertProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Portal Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  {/* Elderly Role Routes */}
                  <Route element={<RoleGuard allowedRoles={['ELDERLY', 'ADMIN']} />}>
                    <Route path="/elderly" element={<ElderlyDashboard />} />
                    <Route path="/elderly/health" element={<ElderlyHealthPage />} />
                    <Route path="/elderly/ecg" element={<ElderlyECGPage />} />
                    <Route path="/elderly/medications" element={<ElderlyMedicationsPage />} />
                    <Route path="/elderly/reminders" element={<ElderlyRemindersPage />} />
                    <Route path="/elderly/wellness" element={<ElderlyWellnessPage />} />
                    <Route path="/elderly/voice" element={<ElderlyVoicePage />} />
                    <Route path="/elderly/entertainment" element={<ElderlyEntertainmentPage />} />
                    <Route path="/elderly/emergency" element={<ElderlyEmergencyPage />} />
                    <Route path="/elderly/messages" element={<ElderlyMessagesPage />} />
                    <Route path="/elderly/community" element={<ElderlyCommunityPage />} />
                    <Route path="/elderly/device" element={<ElderlyDevicePage />} />
                  </Route>

                  {/* Caregiver Role Routes */}
                  <Route element={<RoleGuard allowedRoles={['CAREGIVER', 'ADMIN']} />}>
                    <Route path="/caregiver" element={<CaregiverDashboard />} />
                    <Route path="/caregiver/patients" element={<CaregiverPatientsPage />} />
                    <Route path="/caregiver/health" element={<ElderlyHealthPage />} />
                    <Route path="/caregiver/alerts" element={<CaregiverAlertsPage />} />
                    <Route path="/caregiver/medications" element={<CaregiverMedicationsPage />} />
                    <Route path="/caregiver/messages" element={<ElderlyMessagesPage />} />
                    <Route path="/caregiver/community" element={<ElderlyCommunityPage />} />
                    <Route path="/caregiver/settings" element={<CaregiverSettingsPage />} />
                  </Route>

                  {/* Doctor Role Routes */}
                  <Route element={<RoleGuard allowedRoles={['DOCTOR', 'ADMIN']} />}>
                    <Route path="/doctor" element={<DoctorDashboard />} />
                    <Route path="/doctor/patient/:id" element={<DoctorPatientDetailPage />} />
                    <Route path="/doctor/ecg" element={<ElderlyECGPage />} />
                    <Route path="/doctor/notes" element={<DoctorNotesPage />} />
                    <Route path="/doctor/reports" element={<DoctorReportsPage />} />
                    <Route path="/doctor/messages" element={<ElderlyMessagesPage />} />
                    <Route path="/doctor/rules" element={<CaregiverSettingsPage />} />
                  </Route>

                  {/* Admin Role Routes */}
                  <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/rules" element={<CaregiverSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AlertProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
