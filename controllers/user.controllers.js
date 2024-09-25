import { compare } from 'bcrypt';
import { User } from '../models/user.models.js';
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from '../utils/features.utils.js';
import { TryCatch } from '../middlewares/error.middlewares.js';
import { ErrorHandler } from '../utils/utility.utils.js';
import { Chat } from '../models/chat.models.js';
import { Request } from '../models/request.models.js'
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/event.constants.js';
import { getOtherMember } from '../lib/helper.lib.js';

// Create a new user and save it into the database and save token into cookie.
const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio} = req.body;

    const file = req.file;
    if(!file){
        return next(new ErrorHandler('Please Upload Avatar'));
    }
    const result = await uploadFilesToCloudinary([file]);

    const avatar  = {
        public_id: result[0].public_id,
        url: result[0].url,
    }
    const checkIfUsername = await User.findOne({ username });
    if(checkIfUsername){
        return next(new ErrorHandler('Username is taken please try other username', 400));
    }
   
    const user = await User.create({
        name: name.trim(),
        username: username.trim(),
        password,
        bio: bio.trim(),
        avatar
    });
   sendToken(res, user, 201, 'User Created Successfully.');
})


const login = TryCatch(async (req, res, next) => {
    
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+password');

    if(!user){
        return next(new ErrorHandler('Invaild Username or Password.', 404));
    }

    const isMatch = await compare(password, user.password);

    if(!isMatch){
        return next(new ErrorHandler('Invaild Username or Password.', 404));
    }
    sendToken(res, user, 200, `Welcome back, ${user.name}`);

});

const getMyProfile = TryCatch(async (req, res, next) => {

    const user = await User.findById(req.userId);

    if(!user){
        return next(new ErrorHandler('User Not found', 404));
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

const logout = TryCatch(async (req, res) => {
    return res
        .status(200)
        .cookie('pchat-token', '', {...cookieOptions, maxAge: 0})
        .json({
            success: true,
            message: 'Logged out successfully.',
        });
});

const searchUser = TryCatch(async (req, res) => {
    const { name = '' } = req.query;

    
        // finding all my chats.
    const myChats = await Chat.find({ groupChat: false, members: req.userId});

    // extracting all user from my chat means friends or people I have chatted with.
    const allUserFromMyChats = myChats.flatMap((chat) => chat.members);

    // finding all users except me and my friends.
    const allUserExceptMeAndFriends = await User.find({
        _id: { $nin: allUserFromMyChats }, 
        name: { $regex: name, $options: 'i'}
    });

    // modifying the response.
    const users = allUserExceptMeAndFriends.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url
    }));

    return res
        .status(200)
        .json({
            success: true,
            users,
        });
    }
    

);

const sendFriendRequest = TryCatch(async (req, res, next) => {

    const { userId } = req.body;

    if(req.userId === userId){
        return next(new ErrorHandler('You can\'t sent friend request to yourself.', 400));
    }

    const request = await Request.findOne({
        $or: [
            { sender: req.userId, receiver: userId },
            { sender: userId, receiver: req.userId }
        ]
    });

    if(request){
        return next(new ErrorHandler('Friend request is already sent.', 400));
    }

    await Request.create({
        sender: req.userId,
        receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId]);

    return res.status(200).json({
        success: true,
        message: 'Friend request Sent.'
    });
});

const acceptFriendRequest = TryCatch(async(req, res, next) => {
    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId)
    .populate('sender', 'name')
    .populate('receiver', 'name');

    if(!request){
        return next(new ErrorHandler('Request not found', 404));
    }

    if(request.receiver._id.toString() !== req.userId.toString()){
        return next(new ErrorHandler('You are not authorized to accept this request', 401));
    }
    if(!accept){
        await Request.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Friend Request Rejected.'
        });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
            senderId: request.sender._id
        }),
        request.deleteOne()
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: 'Friend request Accepted',
        sender: request.sender._id
    });
});

const getMyNotifications = TryCatch(async (req, res, next) => {
    const requests = await Request.find({ receiver: req.userId })
    .populate('sender', 'name avatar');
    
    const allRequests = requests.map(({ _id, sender }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url
        }
    }));

   return  res.status(200).json({
        success: true,
        allRequests
    });
});

const getMyFriends = TryCatch(async (req, res, next) => {
    const chatId = req.query.chatId;

    const chats = await Chat.find({ 
        members: req.userId,
        groupChat: false,
    }).populate('members', 'name avatar');


    const friends = chats.map(({ members}) => {
        const otherUser = getOtherMember(members, req.userId);
        
        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url
        }
    });

    if(chatId){

        const chat = await Chat.findById(chatId);
        const availabelFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        );

        return res.status(200).json({
            success: true,
            friends: availabelFriends,
        });


    }else{
        return res.status(200).json({
            success: true,
            friends,
        });
    }

    
});

export { 
    login, 
    newUser, 
    getMyProfile, 
    logout, 
    searchUser, 
    sendFriendRequest, 
    acceptFriendRequest,
    getMyNotifications,
    getMyFriends,

};