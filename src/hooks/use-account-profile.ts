"use client";

import { useEffect, useState } from "react";

import type { AccountProfile } from "@/lib/account/types";
import { getAccountProfile } from "@/services/account-service";

let cachedProfile: AccountProfile | null = null;
let profileRequest: Promise<AccountProfile> | null = null;

async function loadAccountProfile() {
  if (cachedProfile) return cachedProfile;

  profileRequest ??= getAccountProfile().then((profile) => {
    cachedProfile = profile;
    profileRequest = null;
    return profile;
  });

  return profileRequest;
}

export default function useAccountProfile() {
  const [profile, setProfile] = useState<AccountProfile | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    loadAccountProfile()
      .then((nextProfile) => {
        if (ignore) return;
        setProfile(nextProfile);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { error, isLoading, profile };
}
