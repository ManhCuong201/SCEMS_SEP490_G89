import React from 'react'
import './styles/alerts.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { PrivateRoute } from './components/Common/PrivateRoute'
import { Toaster } from 'react-hot-toast'
import { AdminLayout } from './components/Layout/AdminLayout'
import { LoginPage } from './pages/Auth/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DashboardPage } from './pages/Admin/Dashboard/DashboardPage'
import { AccountsListPage } from './pages/Admin/Accounts/AccountsListPage'
import { CreateAccountPage } from './pages/Admin/Accounts/CreateAccountPage'
import { EditAccountPage } from './pages/Admin/Accounts/EditAccountPage'
import { AccountDetailPage } from './pages/Admin/Accounts/AccountDetailPage'
import { RoomsListPage } from './pages/Admin/Rooms/RoomsListPage'
import { CreateRoomPage } from './pages/Admin/Rooms/CreateRoomPage'
import { EditRoomPage } from './pages/Admin/Rooms/EditRoomPage'
import { RoomDetailPage } from './pages/Admin/Rooms/RoomDetailPage'
import { RoomTypesListPage } from './pages/Admin/RoomTypes/RoomTypesListPage'
import { CreateRoomTypePage } from './pages/Admin/RoomTypes/CreateRoomTypePage'
import { EditRoomTypePage } from './pages/Admin/RoomTypes/EditRoomTypePage'
import { DepartmentsListPage } from './pages/Admin/Departments/DepartmentsListPage'
import { CreateDepartmentPage } from './pages/Admin/Departments/CreateDepartmentPage'
import { EditDepartmentPage } from './pages/Admin/Departments/EditDepartmentPage'
import { EquipmentTypesListPage } from './pages/Admin/EquipmentTypes/EquipmentTypesListPage'
import { CreateEquipmentTypePage } from './pages/Admin/EquipmentTypes/CreateEquipmentTypePage'
import { EditEquipmentTypePage } from './pages/Admin/EquipmentTypes/EditEquipmentTypePage'
import { EquipmentTypeDetailPage } from './pages/Admin/EquipmentTypes/EquipmentTypeDetailPage'
import { EquipmentListPage } from './pages/Admin/Equipment/EquipmentListPage'
import { CreateEquipmentPage } from './pages/Admin/Equipment/CreateEquipmentPage'
import { EditEquipmentPage } from './pages/Admin/Equipment/EditEquipmentPage'
import { StaffBookingBoardPage } from './pages/Admin/Bookings/StaffBookingBoardPage'
import { BookingManagementPage } from './pages/Admin/Bookings/BookingManagementPage'
import { AdminClassesPage } from './pages/Admin/Classes/AdminClassesPage'
import { AdminSchedulesPage } from './pages/Admin/Schedules/AdminSchedulesPage'
import { UserLayout } from './components/Layout/UserLayout'
import { UserRoomsListPage } from './pages/User/Rooms/UserRoomsListPage'
import { RoomCalendarPage } from './pages/User/Rooms/RoomCalendarPage'
import { UserBookingsPage } from './pages/User/Bookings/UserBookingsPage'
import { SchedulePage } from './pages/Schedule/SchedulePage'
import TeacherClassesPage from './pages/User/TeacherClassesPage'
import ClassStudentsPage from './pages/User/ClassStudentsPage'
import { useAuth } from './context/AuthContext'
import { DailySchedulerPage } from './pages/User/Dashboard/DailySchedulerPage'
import { AdminIssueReportsPage } from './pages/Admin/IssueReports/AdminIssueReportsPage'
import { UserIssueReportsPage } from './pages/User/IssueReports/UserIssueReportsPage'
import { SecurityDashboardPage } from './pages/Admin/Dashboard/SecurityDashboardPage'
import NotificationsPage from './pages/Notifications/NotificationsPage'
import { ProfilePage } from './pages/Profile/ProfilePage'
import SystemSettingsPage from './pages/Admin/Settings/SystemSettingsPage'
import { LiveStatusPage } from './pages/Admin/Rooms/LiveStatusPage'

const HomeRedirect = () => {
  const { user } = useAuth()
  if (user?.role === 'Admin' || user?.role === 'AssetStaff' || user?.role === 'BookingStaff' || user?.role === 'Guard') {
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Navigate to="/dashboard" replace />
}

const AppContent: React.FC = () => {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/admin/*" element={
        <PrivateRoute allowedRoles={['Admin', 'AssetStaff', 'BookingStaff', 'Guard']}>
          <AdminLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="accounts" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AccountsListPage />
                </PrivateRoute>
              } />
              <Route path="accounts/create" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <CreateAccountPage />
                </PrivateRoute>
              } />
              <Route path="accounts/:id" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AccountDetailPage />
                </PrivateRoute>
              } />
              <Route path="accounts/:id/edit" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EditAccountPage />
                </PrivateRoute>
              } />
              <Route path="rooms" element={
                <PrivateRoute allowedRoles={['Admin', 'AssetStaff']}>
                  <RoomsListPage />
                </PrivateRoute>
              } />
              <Route path="rooms/create" element={
                <PrivateRoute allowedRoles={['Admin', 'AssetStaff']}>
                  <CreateRoomPage />
                </PrivateRoute>
              } />
              <Route path="rooms/:id" element={
                <PrivateRoute allowedRoles={['Admin', 'AssetStaff', 'Guard']}>
                  <RoomDetailPage />
                </PrivateRoute>
              } />
              <Route path="rooms/:id/edit" element={
                <PrivateRoute allowedRoles={['Admin', 'AssetStaff']}>
                  <EditRoomPage />
                </PrivateRoute>
              } />
              <Route path="room-types" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <RoomTypesListPage />
                </PrivateRoute>
              } />
              <Route path="room-types/create" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <CreateRoomTypePage />
                </PrivateRoute>
              } />
              <Route path="room-types/:id/edit" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EditRoomTypePage />
                </PrivateRoute>
              } />
              <Route path="departments" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <DepartmentsListPage />
                </PrivateRoute>
              } />
              <Route path="departments/create" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <CreateDepartmentPage />
                </PrivateRoute>
              } />
              <Route path="departments/:id/edit" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EditDepartmentPage />
                </PrivateRoute>
              } />
              <Route path="booking-board" element={
                <PrivateRoute allowedRoles={['BookingStaff', 'Guard']}>
                  <StaffBookingBoardPage />
                </PrivateRoute>
              } />
              <Route path="bookings" element={
                <PrivateRoute allowedRoles={['BookingStaff']}>
                  <BookingManagementPage />
                </PrivateRoute>
              } />
              <Route path="classes" element={
                <PrivateRoute allowedRoles={['BookingStaff']}>
                  <AdminClassesPage />
                </PrivateRoute>
              } />
              <Route path="classes/:id/students" element={
                <PrivateRoute allowedRoles={['BookingStaff']}>
                  <ClassStudentsPage />
                </PrivateRoute>
              } />
              <Route path="schedules" element={
                <PrivateRoute allowedRoles={['BookingStaff', 'Guard']}>
                  <AdminSchedulesPage />
                </PrivateRoute>
              } />
              <Route path="equipment-types" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EquipmentTypesListPage />
                </PrivateRoute>
              } />
              <Route path="equipment-types/create" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <CreateEquipmentTypePage />
                </PrivateRoute>
              } />
              <Route path="equipment-types/:id" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EquipmentTypeDetailPage />
                </PrivateRoute>
              } />
              <Route path="equipment-types/:id/edit" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <EditEquipmentTypePage />
                </PrivateRoute>
              } />
              <Route path="equipment" element={
                <PrivateRoute allowedRoles={['AssetStaff']}>
                  <EquipmentListPage />
                </PrivateRoute>
              } />
              <Route path="equipment/create" element={
                <PrivateRoute allowedRoles={['AssetStaff']}>
                  <CreateEquipmentPage />
                </PrivateRoute>
              } />
              <Route path="equipment/:id/edit" element={
                <PrivateRoute allowedRoles={['AssetStaff']}>
                  <EditEquipmentPage />
                </PrivateRoute>
              } />
              <Route path="issue-reports" element={
                <PrivateRoute allowedRoles={['Admin', 'AssetStaff', 'Guard']}>
                  <AdminIssueReportsPage />
                </PrivateRoute>
              } />
              <Route path="live-status" element={
                <PrivateRoute allowedRoles={['Guard']}>
                  <LiveStatusPage />
                </PrivateRoute>
              } />
              <Route path="security-checks" element={
                <PrivateRoute allowedRoles={['Guard']}>
                  <SecurityDashboardPage />
                </PrivateRoute>
              } />
              <Route path="settings" element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <SystemSettingsPage />
                </PrivateRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AdminLayout>
        </PrivateRoute>
      } />

      <Route path="/dashboard" element={
        <PrivateRoute>
          <UserLayout>
            <DailySchedulerPage />
          </UserLayout>
        </PrivateRoute>
      } />
      <Route path="/rooms/*" element={
        <PrivateRoute>
          <UserLayout>
            <Routes>
              <Route path="/" element={<UserRoomsListPage />} />
              <Route path="/:id/calendar" element={<RoomCalendarPage />} />
            </Routes>
          </UserLayout>
        </PrivateRoute>
      } />
      {(user?.role === 'Lecturer' || user?.role === 'Student' || user?.role === 'BookingStaff') && (
        <Route path="/schedule" element={
          <PrivateRoute>
            <UserLayout>
              <SchedulePage />
            </UserLayout>
          </PrivateRoute>
        } />
      )}
      <Route path="/my-bookings" element={
        <PrivateRoute>
          <UserLayout>
            <UserBookingsPage />
          </UserLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/*" element={
        <PrivateRoute allowedRoles={['Lecturer']}>
          <UserLayout>
            <Routes>
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="classes/:id/students" element={<ClassStudentsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </UserLayout>
        </PrivateRoute>
      } />
      <Route path="/issue-reports" element={
        <PrivateRoute allowedRoles={['Lecturer', 'Student']}>
          <UserLayout>
            <UserIssueReportsPage />
          </UserLayout>
        </PrivateRoute>
      } />
      <Route path="/notifications" element={
        <PrivateRoute>
          {(user?.role === 'Admin' || user?.role === 'AssetStaff' || user?.role === 'BookingStaff' || user?.role === 'Guard') ? (
            <AdminLayout>
              <NotificationsPage />
            </AdminLayout>
          ) : (
            <UserLayout>
              <NotificationsPage />
            </UserLayout>
          )}
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          {(user?.role === 'Admin' || user?.role === 'AssetStaff' || user?.role === 'BookingStaff' || user?.role === 'Guard') ? (
            <AdminLayout>
              <ProfilePage />
            </AdminLayout>
          ) : (
            <UserLayout>
              <ProfilePage />
            </UserLayout>
          )}
        </PrivateRoute>
      } />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
