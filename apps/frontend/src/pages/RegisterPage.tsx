import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RegisterSchema } from "@savemate/shared-validation";
import type { z } from "zod";

import { register } from "@/api/auth";
import type { NormalizedError } from "@/api/normalizedError";
import { tryDecodeJwtUser } from "@/auth/jwt";
import { useAuth } from "@/auth/useAuth";
import { MotionFade } from "@/components/common/Motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type RegisterForm = z.input<typeof RegisterSchema>;

function postAuthRedirect(accessToken: string) {
  const user = tryDecodeJwtUser(accessToken);
  if (!user) return "/deals";
  switch (user.role) {
    case "ADMIN":
      return "/admin";
    case "BUSINESS":
      return "/business";
    case "USER":
    default:
      return "/deals";
  }
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: "", password: "", role: "USER" },
    mode: "onTouched",
  });

  const selectedRole = form.watch("role") ?? "USER";

  const errorMessage = (form.formState.errors.root as any)?.message as
    | string
    | undefined;

  async function onSubmit(values: RegisterForm) {
    form.clearErrors("root");

    try {
      const res = await register({ ...values, role: values.role ?? "USER" });
      setAccessToken(res.accessToken);
      toast.success("Account created", {
        description: "Welcome! You’re now signed in.",
      });
      navigate(postAuthRedirect(res.accessToken), { replace: true });
    } catch (e2) {
      const err = e2 as NormalizedError;
      form.setError("root", { message: err.error.message });
    }
  }

  return (
    <MotionFade>
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <div className="text-sm text-slate-600">
              Get started with SaveMate in minutes.
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Account type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedRole === "USER" ? "default" : "secondary"}
                    onClick={() =>
                      form.setValue("role", "USER", { shouldDirty: true })
                    }
                  >
                    Personal
                  </Button>
                  <Button
                    type="button"
                    variant={
                      selectedRole === "BUSINESS" ? "default" : "secondary"
                    }
                    onClick={() =>
                      form.setValue("role", "BUSINESS", { shouldDirty: true })
                    }
                  >
                    Business
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Choose Business if you want to publish deals.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email?.message ? (
                  <div className="text-sm text-red-700">
                    {form.formState.errors.email.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...form.register("password")}
                />
                {form.formState.errors.password?.message ? (
                  <div className="text-sm text-red-700">
                    {form.formState.errors.password.message}
                  </div>
                ) : null}
              </div>

              {/* Role stored in the form state via selector above */}
              <input type="hidden" {...form.register("role")} />

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                className="w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating account…" : "Register"}
              </Button>

              <div className="text-sm">
                <Link to="/login" className="text-slate-700 underline">
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MotionFade>
  );
}
