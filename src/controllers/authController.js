import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';

export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(400, 'Email in use');
  }

  // Хешуємо пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Створюємо користувача
  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  const session = await createSession(newUser._id);
  setSessionCookies(res, session);

  // Відправляємо дані користувача (без пароля) у відповіді
  res.status(201).json(newUser);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });
  if (!findUser) {
    throw createHttpError(401, 'Invalid credentials');
  }
  const isPasswordCorrect = await bcrypt.compare(password, findUser.password);
  if (!isPasswordCorrect) {
    throw createHttpError(401, 'Invalid credentials');
  }
  await Session.deleteOne({
    userId: findUser._id,
  });
  const session = await createSession(findUser._id);
  setSessionCookies(res, session);
  res.status(200).json(findUser);
};

export const refreshUserSession = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;
  const session = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }
  if (session.refreshTokenValidUntil < new Date()) {
    await Session.deleteOne({ _id: session._id });

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    throw createHttpError(401, 'Session token expired');
  }
  await Session.deleteOne({
    _id: session._id,
  });
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);
  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }
  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};
