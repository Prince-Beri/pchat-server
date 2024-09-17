import { userSocketIDs } from "../app.js";

export const getOtherMember = (members, userId) => members.find((member) => member._id.toString() !== userId.toString());

export const getSockets = (users = []) => {
    const sockets = users.map(userId => userSocketIDs.get(userId.toString()));
    return sockets;
}

export const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;