import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  USER_ROLE_COMPLIANCE_MANAGER,
  normalizeDirectoryUser,
  users as fallbackUsers,
} from "../data/users";

import {
  fetchSecureframeUsers,
  hasSecureframeConfiguration,
} from "../services/secureframeService";

import { UserContext } from "./userContextValue";

function getInitialUserId() {
  const configuredUserId = String(
    import.meta.env.VITE_CURRENT_USER_ID ?? ""
  ).trim();

  if (
    configuredUserId &&
    fallbackUsers.some(
      (user) => user.id === configuredUserId
    )
  ) {
    return configuredUserId;
  }

  return fallbackUsers[0]?.id ?? "";
}

function mergeDirectoryUsers(localUsers, externalUsers) {
  const mergedUsers = new Map();

  [...localUsers, ...externalUsers].forEach((user) => {
    const normalizedUser = normalizeDirectoryUser(user);

    if (!normalizedUser.id) {
      return;
    }

    const existingUser = mergedUsers.get(normalizedUser.id);

    mergedUsers.set(normalizedUser.id, {
      ...existingUser,
      ...normalizedUser,
      role:
        existingUser?.role ===
        USER_ROLE_COMPLIANCE_MANAGER
          ? existingUser.role
          : normalizedUser.role,
    });
  });

  return Array.from(mergedUsers.values()).sort(
    (first, second) =>
      first.name.localeCompare(second.name)
  );
}

export function UserProvider({ children }) {
  const [directoryUsers, setDirectoryUsers] =
    useState(fallbackUsers);

  const [currentUserId, setCurrentUserId] =
    useState(getInitialUserId);

  const [directoryLoading, setDirectoryLoading] =
    useState(false);

  const [directoryError, setDirectoryError] =
    useState("");

  const [directorySource, setDirectorySource] =
    useState("local");

  useEffect(() => {
    if (!hasSecureframeConfiguration()) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadSecureframeDirectory() {
      try {
        setDirectoryLoading(true);
        setDirectoryError("");

        const secureframeUsers =
          await fetchSecureframeUsers({
            signal: controller.signal,
          });

        if (controller.signal.aborted) {
          return;
        }

        setDirectoryUsers(
          mergeDirectoryUsers(
            fallbackUsers,
            Array.isArray(secureframeUsers)
              ? secureframeUsers
              : []
          )
        );
        setDirectorySource("secureframe");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDirectoryUsers(fallbackUsers);
        setDirectorySource("local");
        setDirectoryError(
          error instanceof Error
            ? error.message
            : "Unable to load the Secureframe user directory."
        );
      } finally {
        if (!controller.signal.aborted) {
          setDirectoryLoading(false);
        }
      }
    }

    loadSecureframeDirectory();

    return () => {
      controller.abort();
    };
  }, []);

  const currentUser =
    directoryUsers.find(
      (user) => user.id === currentUserId
    ) ??
    directoryUsers[0] ??
    null;



  const value = useMemo(
    () => ({
      users: directoryUsers,
      currentUser,
      setCurrentUserId,
      directoryLoading,
      directoryError,
      directorySource,
      isComplianceManager:
        currentUser?.role ===
        USER_ROLE_COMPLIANCE_MANAGER,
    }),
    [
      currentUser,
      directoryError,
      directoryLoading,
      directorySource,
      directoryUsers,
    ]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
