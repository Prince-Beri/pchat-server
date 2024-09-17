import { ErrorHandler } from '../utils/utility.utils.js';
import jwt from 'jsonwebtoken';
import { adminSecretKey } from '../app.js'
import { TryCatch } from './error.middlewares.js';
import { PCHAT_TOKEN } from '../constants/config.constants.js';
import { User } from '../models/user.models.js';

const isAuthenticated = TryCatch((req, res, next) => {
    const token = req.cookies[PCHAT_TOKEN];
    if(!token){
        return next(new ErrorHandler('Please login to access this route', 401));  
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedData._id;
    next();
});

const isAdmin = (req, res, next) => {
    const token = req.cookies['pchat-admin-token'];
    if(!token){
        return next(new ErrorHandler('Only admin can access this route', 401));  
    }
    const secretKey = jwt.verify(token, process.env.JWT_SECRET);
    const isMatched = secretKey === adminSecretKey;

    if(!isMatched){
        return next(new ErrorHandler('Only admin can access this route', 401));
    }
    next();
}

const socketAuthenticator = async (err, socket, next) => {
    try {
        if(err) return next(err);
            
            const authToken = socket.request.cookies[PCHAT_TOKEN];

            if(!authToken){
                return next(new ErrorHandler('Please login to access this Route', 401));
            }

            const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

            const user = await User.findById(decodedData._id);

            if(!user){
                return next(new ErrorHandler('Please login to access this Route', 401));
            }

            socket.user = user;
            
            return next();
        
    } catch (error) {
        console.log(error);
        return next(ErrorHandler('Please login to access this Route', 401));
    }
}

export { isAuthenticated, isAdmin, socketAuthenticator};