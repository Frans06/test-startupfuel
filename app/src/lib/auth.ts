import { createAuthClient } from "better-auth/react";
import { getServerUrl } from "./utils";

export const authClient = createAuthClient({
  baseURL: getServerUrl(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
