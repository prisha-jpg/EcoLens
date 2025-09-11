import express from 'express'
import {loginUser, registerUser, getMe, updateMe} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/me', authUser, getMe)
userRouter.put('/me', authUser, updateMe)

    
export default userRouter;