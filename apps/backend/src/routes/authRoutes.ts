import { Router } from "express";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@savemate/shared-validation";
import { validateBody } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { AppError } from "../middlewares/AppError.js";
import {
  issuePasswordReset,
  login,
  refresh,
  register,
  resetPassword,
} from "../services/authService.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const IS_PROD = process.env.NODE_ENV === "production";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(RegisterSchema),
  async (req, res, next) => {
    try {
      const { accessToken, refreshToken } = await register(req.body);

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: IS_PROD,
        path: "/auth/refresh",
      });

      return res.status(201).json({ accessToken });
    } catch (e) {
      return next(e);
    }
  }
);

authRouter.post("/login", validateBody(LoginSchema), async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await login(req.body);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      path: "/auth/refresh",
    });

    return res.json({ accessToken });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token)
      throw new AppError("UNAUTHORIZED", "Missing refresh token", 401);

    const { accessToken, refreshToken } = refresh(token);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      path: "/auth/refresh",
    });

    return res.json({ accessToken });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/logout", requireAuth, async (_req, res, next) => {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth/refresh" });
    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
});

authRouter.post(
  "/forgot",
  validateBody(ForgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { token } = await issuePasswordReset(req.body.email);
      // Avoid leaking reset tokens in production.
      if (IS_PROD) return res.json({ ok: true });
      return res.json({ ok: true, token });
    } catch (e) {
      return next(e);
    }
  }
);

authRouter.post(
  "/reset",
  validateBody(ResetPasswordSchema),
  async (req, res, next) => {
    try {
      await resetPassword(req.body.token, req.body.newPassword);
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  }
);
