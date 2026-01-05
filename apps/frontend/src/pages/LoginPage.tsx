import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { LoginSchema } from "@savemate/shared-validation";
import type { z } from "zod";

import { login } from "@/api/auth";
import type { NormalizedError } from "@/api/normalizedError";
import { MotionFade } from "@/components/common/Motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { tryDecodeJwtUser } from "@/auth/jwt";
import { useAuth } from "@/auth/useAuth";

type LoginForm = z.infer<typeof LoginSchema>;

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

export function LoginPage() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const errorMessage = (form.formState.errors.root as any)?.message as
    | string
    | undefined;

  async function onSubmit(values: LoginForm) {
    form.clearErrors("root");

    try {
      const res = await login(values);
      setAccessToken(res.accessToken);
      toast.success("Welcome back", { description: "You’re now signed in." });
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
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <div className="text-sm text-slate-600">
              Sign in to manage your account.
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                {form.formState.errors.password?.message ? (
                  <div className="text-sm text-red-700">
                    {form.formState.errors.password.message}
                  </div>
                ) : null}
              </div>

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
                {form.formState.isSubmitting ? "Signing in…" : "Login"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot" className="text-slate-700 underline">
                  Forgot password?
                </Link>
                <Link to="/register" className="text-slate-700 underline">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MotionFade>
  );
}
