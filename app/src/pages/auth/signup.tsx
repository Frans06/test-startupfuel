import { signUp, useSession } from "@/lib/auth";
import { useForm } from "@tanstack/react-form";
import { signupValidator } from "@/utils/schemas";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export const SignUpForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPending, refetch, data } = useSession();
  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      signUp.email(value, {
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
    validators: {
      onChange: signupValidator,
    },
  });

  useEffect(() => {
    if (!isPending && data) navigate("/");
  }, [isPending, data]);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t("signup.title")}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name">
          {(field) => {
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">{t("signup.name.label")}</Label>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder={t("signup.name.placeholder")}
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
        <form.Field name="email">
          {(field) => {
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t("signup.email.label")}</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("signup.email.placeholder")}
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
                <Label htmlFor="password">{t("signup.password.label")}</Label>

                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.password.placeholder")}
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

        <form.Field name="confirmPassword">
          {(field) => {
            return (
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">
                  {t("signup.confirmPassword.label")}
                </Label>

                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.password.placeholder")}
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
        <Button variant="link" onClick={() => navigate("/auth/login")}>
          {t("signup.login")}
        </Button>
      </form>
    </div>
  );
};
