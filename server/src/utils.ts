import { createId } from "@paralleldrive/cuid2";
export const generateRandomString = () => {
  return createId();
};

export const getAppUrl = () => {
  return process.env.APP_URL ?? "http://localhost:3000";
};
