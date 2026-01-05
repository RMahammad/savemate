import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { z } from "zod";

import { ForgotPasswordSchema } from "@savemate/shared-validation";
import { forgotPassword } from "@/api/auth";
import type { NormalizedError } from "@/api/normalizedError";
import { MotionFade } from "@/components/common/Motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type ForgotForm = z.infer<typeof ForgotPasswordSchema>;

export function ForgotPasswordPage() {
  const form = useForm<ForgotForm>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const errorMessage = (form.formState.errors.root as any)?.message as
    | string
    | undefined;

  async function onSubmit(values: ForgotForm) {
    form.clearErrors("root");
    try {
      const res = await forgotPassword(values);
      toast.success("Request received", {
        description:
          "If an account exists, you’ll receive a reset link shortly.",
      });

      // If backend returns token in dev, show it as well.
      if ((res as any)?.token) {
        toast.message("Dev reset token", {
          description: String((res as any).token),
        });
      }

      form.reset({ email: values.email });
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
            <CardTitle className="text-xl">Forgot password</CardTitle>
            <div className="text-sm text-slate-600">
              We’ll send you a reset link if the email exists.
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
                {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
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
