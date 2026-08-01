import {
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import { useUser } from "../context/useUser";

function RequireComplianceManager({ children }) {
  const { isComplianceManager } = useUser();
  const location = useLocation();
  const { id } = useParams();

  if (isComplianceManager) {
    return children;
  }

  const fallbackPath = id
    ? `/custom-frameworks/${id}`
    : "/custom-frameworks";

  return (
    <Navigate
      to={fallbackPath}
      replace
      state={{
        accessDenied: true,
        from: location.pathname,
      }}
    />
  );
}

export default RequireComplianceManager;
