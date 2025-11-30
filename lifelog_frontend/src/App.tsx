import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DailyPage } from "./pages/DailyPage";
import { GraphsPage } from "./pages/GraphsPage";

const navBase =
  "flex-1 text-center py-3 rounded-full transition font-medium text-sm";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="max-w-xl w-full mx-auto px-4 pb-28 pt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/graphs" element={<GraphsPage />} />
        </Routes>
      </div>
      <nav className="fixed bottom-4 left-0 right-0 px-6">
        <div className="max-w-xl mx-auto bg-white shadow-card rounded-full flex gap-2 p-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navBase} ${isActive ? "bg-accent text-white" : "text-slate-700"}`
            }
          >
            ホーム
          </NavLink>
          <NavLink
            to="/daily"
            className={({ isActive }) =>
              `${navBase} ${isActive ? "bg-accent text-white" : "text-slate-700"}`
            }
          >
            日別
          </NavLink>
          <NavLink
            to="/graphs"
            className={({ isActive }) =>
              `${navBase} ${isActive ? "bg-accent text-white" : "text-slate-700"}`
            }
          >
            グラフ
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
