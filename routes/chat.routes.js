import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';
import { attachmentsMulter } from '../middlewares/multer.middlewares.js';
import { 
    addMembersValidator, 
    chatIdValidator,  
    newGroupValidator, 
    removeMemberValidator, 
    renameGroupValidator, 
    sendAttachmentsValidator, 
    validatorHandler 
} from '../lib/validators.lib.js';

import { 
    addMembers, 
    deleteChat, 
    getChatDetails, 
    getMessages, 
    getMyChats, 
    getMyGroups, 
    leaveGroup, 
    newGroupChat, 
    removeMember, 
    renameGroup, 
    sendAttachments
} from '../controllers/chat.controllers.js';


const app = express.Router();

app.use(isAuthenticated);

app.post('/new',newGroupValidator(), validatorHandler, newGroupChat);

app.get('/my', getMyChats);

app.get('/my/groups', getMyGroups);

app.put('/addmembers', addMembersValidator(), validatorHandler, addMembers);

app.put('/removemember', removeMemberValidator(), validatorHandler, removeMember);

app.delete('/leave/:id', chatIdValidator(), validatorHandler, leaveGroup);

app.post('/message', attachmentsMulter, sendAttachmentsValidator(), validatorHandler, sendAttachments);

// Get Messages.
app.get('/message/:id',chatIdValidator(), validatorHandler, getMessages);

// Get Chat Details, rename, delete
app.route('/:id')
.get(chatIdValidator(), validatorHandler, getChatDetails)
.put(renameGroupValidator(), validatorHandler, renameGroup)
.delete(chatIdValidator(), validatorHandler, deleteChat);


export default app;