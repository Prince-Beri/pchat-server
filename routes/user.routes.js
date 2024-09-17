import express from 'express';
import { 
    acceptFriendRequest, 
    getMyFriends, 
    getMyNotifications, 
    getMyProfile, 
    login, 
    logout, 
    newUser, 
    searchUser, 
    sendFriendRequest
} from '../controllers/user.controllers.js';

import { 
    acceptFriendRequestValidator, 
    loginValidator, 
    registerValidator, 
    sendFriendRequestValidator, 
    validatorHandler 
} from '../lib/validators.lib.js';

import { singleAvatar } from '../middlewares/multer.middlewares.js'
import { isAuthenticated } from '../middlewares/auth.middlewares.js';

const  app = express.Router();
app.post('/new', singleAvatar,registerValidator(), validatorHandler, newUser);
app.post('/login', loginValidator(), validatorHandler, login);

// After here user must be logged in to access these routes.
app.use(isAuthenticated);

app.get('/me', getMyProfile);
app.get('/logout', logout);
app.get('/search', searchUser);
app.put('/sendrequest', sendFriendRequestValidator(), validatorHandler,sendFriendRequest);
app.put('/acceptrequest', acceptFriendRequestValidator(), validatorHandler, acceptFriendRequest);
app.get('/notifications', getMyNotifications);
app.get('/friends', getMyFriends);

export default app;