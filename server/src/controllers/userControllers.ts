import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { Response, Request } from 'express';
import User from '../models/user_model';
import Blog from '../models/blog_model';
import { getIdFromHeader } from '../helper/getIdFromHeader';

const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15d',
    }
  );
};

// get user by id
const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ _id: id });
    res.status(200).json({ name: user.name, image: user.image });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// get user
const getUser = async (req: Request, res: Response) => {
  try {
    const userId = getIdFromHeader(req.headers['x-access-token']);
    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) throw new Error('User not found');
    res.status(200).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { name } = req.body;
  const { id } = req.params;

  try {
    if (!name) throw new Error('Name is required');
    if (!validator.isLength(name, { min: 3, max: 20 })) {
      throw new Error('Name must be between 3 and 20 characters');
    }
    await User.findOneAndUpdate({ _id: id }, { name });
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// login user
const login_user = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) throw new Error('All fields must be filled out');

    const user = await User.findOne({ email });
    if (!user) throw Error('Invalid credentials');

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) throw new Error('Invalid credentials');
    const token = generateToken(user);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// signup user
const signup_user = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      throw Error('All fields must be filled out');
    }

    if (!validator.isEmail(email)) {
      throw Error('Invalid Email Address');
    }

    if (!validator.isStrongPassword(password)) {
      throw Error('Password is not strong enough');
    }

    if (!validator.isLength(name, { min: 3, max: 20 })) {
      throw Error('Name must be between 3 and 20 characters');
    }

    const emailExists = await User.findOne({ email });
    const nameExists = await User.findOne({ name });
    if (emailExists) throw Error('Email already in use');
    if (nameExists) throw Error('Name already in use');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hash });

    const token = generateToken(user);

    res
      .status(200)
      .json({ id: user._id, name: user.name, email: user.email, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const delete_user = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findOneAndDelete({ _id: id }).select('-password');
    if (!user) throw new Error('User not found');

    await Blog.deleteMany({ createdBy: id });

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const getUserProfileImage = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    const userId = getIdFromHeader(req.headers['x-access-token']);

    await User.findOneAndUpdate({ _id: userId }, { image });

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export {
  login_user,
  signup_user,
  getUserById,
  getUser,
  updateUser,
  delete_user,
  getUserProfileImage,
};
