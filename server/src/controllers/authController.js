import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

function buildAuthResponse(user) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email, role: user.role });
  return { accessToken, refreshToken };
}

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await User.create({
      email: payload.email,
      name: payload.name,
      passwordHash
    });

    const tokens = buildAuthResponse(user);
    user.refreshTokens.push({ tokenHash: hashToken(tokens.refreshToken) });
    await user.save();

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = buildAuthResponse(user);
    user.refreshTokens.push({ tokenHash: hashToken(tokens.refreshToken) });
    await user.save();

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens
    });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const hasToken = user.refreshTokens.some((entry) => entry.tokenHash === tokenHash);
    if (!hasToken) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    const nextTokens = buildAuthResponse(user);
    user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash);
    user.refreshTokens.push({ tokenHash: hashToken(nextTokens.refreshToken) });
    await user.save();

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...nextTokens
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(204).send();
    }

    const tokenHash = hashToken(refreshToken);
    user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash);
    await user.save();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
