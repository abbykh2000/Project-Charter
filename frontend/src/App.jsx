import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import { UserProvider } from "./context/UserContext";
import RequireComplianceManager from "./components/RequireComplianceManager";

import Overview from "./pages/Overview";
import FrameworkDetail from "./pages/FrameworkDetail";
import CustomFrameworks from "./pages/CustomFrameworks";
import CreateCustomFramework from "./pages/CreateCustomFramework";
import CustomFrameworkDetail from "./pages/CustomFrameworkDetail";
import EditCustomFramework from "./pages/EditCustomFramework";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Overview />} />

          <Route
            path="/framework/:id"
            element={<FrameworkDetail />}
          />

          <Route
            path="/custom-frameworks"
            element={<CustomFrameworks />}
          />

          <Route
            path="/custom-frameworks/create"
            element={
              <RequireComplianceManager>
                <CreateCustomFramework />
              </RequireComplianceManager>
            }
          />

          <Route
            path="/custom-frameworks/:id/edit"
            element={
              <RequireComplianceManager>
                <EditCustomFramework />
              </RequireComplianceManager>
            }
          />

          <Route
            path="/custom-frameworks/:id"
            element={<CustomFrameworkDetail />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
