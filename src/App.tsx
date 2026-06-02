import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Admin } from "./pages/Admin";
import { EmployerDashboard } from "./pages/EmployerDashboard";
import { EmployerPost } from "./pages/EmployerPost";
import { EmployerSuccess } from "./pages/EmployerSuccess";
import { Home } from "./pages/Home";
import { JobDetail } from "./pages/JobDetail";
import { Jobs } from "./pages/Jobs";
import { Login } from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="employer/post" element={<EmployerPost />} />
        <Route path="employer/success" element={<EmployerSuccess />} />
        <Route path="employer/dashboard" element={<EmployerDashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
