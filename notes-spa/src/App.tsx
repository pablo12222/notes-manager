import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Board from "./pages/Board";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Shell from "./components/Shell";
import { RequireAuth } from "./RequireAuth";
import { RequirePermission } from "./permissions";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        <Route
          path="/notes"
          element={
            <RequireAuth>
              <Notes />
            </RequireAuth>
          }
        />
        <Route
          path="/board"
          element={
            <RequireAuth>
              <Board />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequirePermission perm="read:admin-secret" redirectTo="/">
              <Admin />
            </RequirePermission>
          }
        />
      </Route>
    </Routes>
  );
}
