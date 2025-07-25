import { createTRPCContext } from "@trpc/tanstack-react-query";
import { AppRouter } from "../../../server/src/root";
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
