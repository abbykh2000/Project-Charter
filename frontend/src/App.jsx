import { BrowserRouter, Routes, Route } from "react-router-dom";
import Overview from "./pages/Overview";
import FrameworkDetail from "./pages/FrameworkDetail";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Overview />}
        />

        <Route
          path="/framework/:id"
          element={<FrameworkDetail />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;

