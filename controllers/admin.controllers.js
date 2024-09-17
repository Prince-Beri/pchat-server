import jwt from "jsonwebtoken";
import { adminSecretKey } from "../app.js";
import { TryCatch } from "../middlewares/error.middlewares.js";
import { Chat } from "../models/chat.models.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { cookieOptions } from "../utils/features.utils.js";
import { ErrorHandler } from "../utils/utility.utils.js";

const adminLogin = TryCatch(async (req, res, next) => {
    const { secretKey } = req.body;
    const isMatched = secretKey === adminSecretKey;

    if(!isMatched){
        return next(new ErrorHandler('Invalid Admin Key', 401));
    }

    const token = jwt.sign(secretKey, process.env.JWT_SECRET);
    

    return res.status(200).cookie('pchat-admin-token', token, { ...cookieOptions, maxAge: 1000 * 60 * 15
    }).json({
        success: true,
        message: 'Authenticated Successfully, Welcome BOSS.'
    });
});

const adminLogout = TryCatch(async (req, res, next) => {
    return res.status(200).cookie('pchat-admin-token', '', { ...cookieOptions, maxAge: 0 }).json({
        success: true,
        message: 'Logged out Successfully.'
    });
});

const getAdminData = TryCatch(async (req, res, next) => {
    return res.status(200).json({
        admin: true,
    });
});

const getAllUsers = TryCatch(async (req, res, next) => {

    const users = await User.find();

    const transformUsers = await Promise.all(
        users.map(async ({ _id, name, username, avatar }) => {
        const [groups, friends] = await Promise.all([
            Chat.countDocuments({ groupChat: true, members:  _id}),
            Chat.countDocuments({ groupChat: false, members: _id})
        ])
        return {
            _id,
            name,
            username,
            avatar: avatar.url,
            groups,
            friends
        }
    }));
    return res.status(200).json({
        success: true,
        users: transformUsers,
    })
});

const getAllChats = TryCatch(async (req, res, next) => {

    const chats = await Chat.find()
    .populate('members', 'name avatar')
    .populate('creator', 'name avatar');

    const transformChats = await Promise.all(
        chats.map(async ({ members, _id, groupChat, name, creator }) => {
        
        const totalMessages = await Message.countDocuments({ chat: _id});

        return {
            _id,
            groupChat,
            name, 
            avatar: members.slice(0, 3).map((member) => member.avatar.url),
            members: members.map(({ _id, name, avatar }) => (
                {
                    _id,
                    name,
                    avatar: avatar.url,
                }
            )),
            creator: {
                name: creator?.name || 'None',
                avatar: creator?.avatar.url || '',
            },

            totalMembers: members.length,
            totalMessages,

        }
    }));
    return res.status(200).json({
        success: true,
        chats: transformChats,
    });
});

const getAllMessages = TryCatch(async (req, res, next) => {
    const messages = await Message.find()
    .populate('sender', 'name avatar')
    .populate('chat', 'groupChat');
    
    const transformMessages = messages.map(
        ({ _id, content, attachments, sender, createdAt, chat}) => ({
        _id,
        content,
        attachments,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url
        }

    }))
    return res.status(200).json({
        success: true,
        messages: transformMessages,
    })
});

const getDashboardStats = TryCatch(async (req, res, next) => {

    const [groupsCount, usersCount, messagesCount, totalChatsCount] = await Promise.all([
       Chat.countDocuments({ groupChat: true,}),
       User.countDocuments(),
       Message.countDocuments(),
       Chat.countDocuments()
    ]);

    const stats = {
        groupsCount,
        usersCount,
        messagesCount,
        totalChatsCount
    }
    const today = new Date();

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last7DaysMessages = await Message.find({
        createdAt: {
            $gte: last7Days,
            $lte: today,
        }
    });

    const messages = new Array(7).fill(0);
    const dayInMiliseconds = (1000 * 60 * 60 * 24);

    last7DaysMessages.forEach((message) => {
        const indexApprox = (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
        const index = Math.floor(indexApprox);
        messages[6 - index]++;
    });

    return res.status(200).json({
        success: true,
        stats,
        messagesChart: messages,

    });
});



export {
    adminLogin,
    adminLogout,
    getAdminData, getAllChats,
    getAllMessages, getAllUsers, getDashboardStats
};
