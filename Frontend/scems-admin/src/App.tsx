import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/Common/PrivateRoute'
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
import { EquipmentTypesListPage } from './pages/Admin/EquipmentTypes/EquipmentTypesListPage'
import { CreateEquipmentTypePage } from './pages/Admin/EquipmentTypes/CreateEquipmentTypePage'
import { EditEquipmentTypePage } from './pages/Admin/EquipmentTypes/EditEquipmentTypePage'
import { EquipmentTypeDetailPage } from './pages/Admin/EquipmentTypes/EquipmentTypeDetailPage'
import { EquipmentListPage } from './pages/Admin/Equipment/EquipmentListPage'
import { CreateEquipmentPage } from './pages/Admin/Equipment/CreateEquipmentPage'
import { EditEquipmentPage } from './pages/Admin/Equipment/EditEquipmentPage'
import { BookRoomPage } from './pages/Admin/Rooms/BookRoomPage'
import { BookingManagementPage } from './pages/Admin/Bookings/BookingManagementPage'
import { UserLayout } from './components/Layout/UserLayout'
import { UserRoomsListPage } from './pages/User/Rooms/UserRoomsListPage'
import { RoomCalendarPage } from './pages/User/Rooms/RoomCalendarPage'
import { UserBookingsPage } from './pages/User/Bookings/UserBookingsPage'
import { useAuth } from './context/AuthContext'

const HomeRedirect = () => {
    const { user } = useAuth()
    if (user?.role === 'Admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/rooms" replace />
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/admin/*" element={
            <PrivateRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="accounts" element={<AccountsListPage />} />
                  <Route path="accounts/create" element={<CreateAccountPage />} />
                  <Route path="accounts/:id" element={<AccountDetailPage />} />
                  <Route path="accounts/:id/edit" element={<EditAccountPage />} />
                  <Route path="rooms" element={<RoomsListPage />} />
                  <Route path="rooms/create" element={<CreateRoomPage />} />
                  <Route path="rooms/:id" element={<RoomDetailPage />} />
                  <Route path="rooms/:id/edit" element={<EditRoomPage />} />
                  <Route path="rooms/:id/book" element={<BookRoomPage />} />
                  <Route path="bookings" element={<BookingManagementPage />} />
                  <Route path="equipment-types" element={<EquipmentTypesListPage />} />
                  <Route path="equipment-types/create" element={<CreateEquipmentTypePage />} />
                  <Route path="equipment-types/:id" element={<EquipmentTypeDetailPage />} />
                  <Route path="equipment-types/:id/edit" element={<EditEquipmentTypePage />} />
                  <Route path="equipment" element={<EquipmentListPage />} />
                  <Route path="equipment/create" element={<CreateEquipmentPage />} />
                  <Route path="equipment/:id/edit" element={<EditEquipmentPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AdminLayout>
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
          <Route path="/my-bookings" element={
            <PrivateRoute>
              <UserLayout>
                 <UserBookingsPage />
              </UserLayout>
            </PrivateRoute>
          } />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
