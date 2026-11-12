import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div className="main-layout">
      <a className="skip-link" href="#main-content">Ir al contenido</a>
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-container" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
