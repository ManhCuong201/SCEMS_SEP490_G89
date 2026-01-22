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
                  <Route path="equipment-types" element={<EquipmentTypesListPage />} />
                  <Route path="equipment-types/create" element={<CreateEquipmentTypePage />} />
                  <Route path="equipment-types/:id" element={<EquipmentTypeDetailPage />} />
                  <Route path="equipment-types/:id/edit" element={<EditEquipmentTypePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
