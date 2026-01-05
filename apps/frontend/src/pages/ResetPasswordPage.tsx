import { Link, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { z } from "zod";

import { ResetPasswordSchema } from "@savemate/shared-validation";
import { resetPassword } from "@/api/auth";
import type { NormalizedError } from "@/api/normalizedError";
import { MotionFade } from "@/components/common/Motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type ResetForm = z.infer<typeof ResetPasswordSchema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";

  const form = useForm<ResetForm>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token: tokenFromUrl, newPassword: "" },
    mode: "onTouched",
  });

  const errorMessage = (form.formState.errors.root as any)?.message as
    | string
    | undefined;

  async function onSubmit(values: ResetForm) {
    form.clearErrors("root");
    try {
      await resetPassword(values);
      toast.success("Password updated", {
        description: "You can now sign in with the new password.",
      });
      form.reset({ token: values.token, newPassword: "" });
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
            <CardTitle className="text-xl">Reset password</CardTitle>
            <div className="text-sm text-slate-600">
              Paste your reset token and choose a new password.
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Paste reset token"
                  {...form.register("token")}
                />
                {form.formState.errors.token?.message ? (
                  <div className="text-sm text-red-700">
                    {form.formState.errors.token.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...form.register("newPassword")}
                />
                {form.formState.errors.newPassword?.message ? (
                  <div className="text-sm text-red-700">
                    {form.formState.errors.newPassword.message}
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
                {form.formState.isSubmitting ? "Updating…" : "Reset password"}
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
