import express from 'express';
import { 
    adminLogin, 
    adminLogout, 
    getAdminData, 
    getAllChats, 
    getAllMessages, 
    getAllUsers, 
    getDashboardStats 
} from '../controllers/admin.controllers.js';
import { adminLoginValidator, validatorHandler } from '../lib/validators.lib.js';
import { isAdmin } from '../middlewares/auth.middlewares.js';

const app = express.Router();

app.post('/verify', adminLoginValidator(), validatorHandler, adminLogin);
app.get('/logout', adminLogout);

// Only Admin can access these Routes.

app.use(isAdmin);
app.get('/', getAdminData);
app.get('/users', getAllUsers);
app.get('/chats', getAllChats);
app.get('/messages', getAllMessages);
app.get('/stats', getDashboardStats);

export default app;