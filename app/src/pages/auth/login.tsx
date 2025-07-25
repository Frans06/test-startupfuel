import { signIn, useSession } from "@/lib/auth";
import { useForm } from "@tanstack/react-form";
import { loginSchema } from "@/utils/schemas";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPending, data, refetch } = useSession();
  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      signIn.email(value, {
        onSuccess: () => {
          toast(t("signup.toast.success"));
          refetch();
        },
        onError: ({ error }) => {
          if (error.message) toast.error(error.message);
          else toast.error(t("signup.toast.error"));
        },
      });
    },
    validators: { onChange: loginSchema },
  });

  useEffect(() => {
    if (!isPending && data) navigate("/");
  }, [isPending, data]);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => {
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t("login.email.label")}</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.email.placeholder")}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {!field.state.meta.isValid && (
                  <em role="alert" className="text-red-300 text-sm">
                    {field.state.meta.errors
                      .map((e) => t(e?.message || ""))
                      .join(", ")}
                  </em>
                )}
              </div>
            );
          }}
        </form.Field>
        <form.Field name="password">
          {(field) => {
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t("login.password.label")}</Label>

                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("login.password.placeholder")}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {!field.state.meta.isValid && (
                  <em role="alert" className="text-red-300 text-sm">
                    {field.state.meta.errors
                      .map((e) => t(e?.message || ""))
                      .join(", ")}
                  </em>
                )}
              </div>
            );
          }}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => {
            return (
              <Button disabled={!canSubmit} type="submit">
                {isSubmitting ? <Loader /> : t("generics.submit")}
              </Button>
            );
          }}
        </form.Subscribe>
        <Button variant="link" onClick={() => navigate("/auth/signup")}>
          {t("login.signup")}
        </Button>
      </form>
    </div>
  );
};
