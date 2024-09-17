import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.utils.js";

const validatorHandler = (req, res, next) => {
    const errors = validationResult(req);
    const errorMessages = errors.array().map((error) => error.msg).join(', ');
    
    if(errors.isEmpty()){
        return next();
    }else{
        return next(new ErrorHandler(errorMessages, 400));
    }
}

const registerValidator = () => [
    body('name', 'Please enter Name').notEmpty(),
    body('username', 'Please enter Username').notEmpty(),
    body('password', 'Please enter Password').notEmpty(),
    body('bio', 'Please enter Bio').notEmpty(),
];

const loginValidator = () => [
    // body('username', 'Please enter Username').notEmpty(),
    body('password', 'Please enter Password').notEmpty(),
];

const newGroupValidator = () => [
    body('name', 'Please enter the Group Name').notEmpty(),
    body('members')
    .notEmpty()
    .withMessage('Please enter members')
    .isArray({ min: 2, max: 100})
    .withMessage('Members must be 2-100')
];

const addMembersValidator = () => [
    body('chatId', 'Please enter the Chat ID').notEmpty(),
    body('members')
    .notEmpty()
    .withMessage('Please enter the members')
    .isArray({ min: 1, max: 97})
    .withMessage('Members must be 1-97')
];


const removeMemberValidator = () => [
    body('chatId', 'Please enter the Chat ID').notEmpty(),
    body('userId', 'Please enter the User ID').notEmpty()
];


const sendAttachmentsValidator = () => [
    body('chatId', 'Please enter chat ID').notEmpty(),
    
];

const chatIdValidator = () => [
    param('id', 'Please enter Chat ID').notEmpty()
];

const renameGroupValidator = () => [
    param('id', 'Please enter Chat ID').notEmpty(),
    body('name', 'Please enter new name for Group').notEmpty(),
];

const sendFriendRequestValidator = () => [
    body('userId', 'Please enter User ID.').notEmpty()
];

const acceptFriendRequestValidator = () => [
    body('requestId', 'Please enter Request ID').notEmpty(),
    body('accept')
    .notEmpty()
    .withMessage('Please add Accept')
    .isBoolean()
    .withMessage('Accept must  be boolean')
]

const adminLoginValidator = () => [
    body('secretKey', 'Please Enter Secret Key').notEmpty()
]

export {
    acceptFriendRequestValidator, addMembersValidator, adminLoginValidator, chatIdValidator, loginValidator,
    newGroupValidator, registerValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, sendFriendRequestValidator, validatorHandler
};
