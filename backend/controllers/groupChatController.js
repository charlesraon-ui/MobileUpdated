import GroupChat from "../models/GroupChat.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";

// Create a new group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name, description, participantIds } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ 
        message: "Group name and participants are required" 
      });
    }

    // Ensure admin is included in participants
    const allParticipants = [...new Set([adminId, ...participantIds])];

    // Validate all participants exist
    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      return res.status(400).json({ 
        message: "One or more participants not found" 
      });
    }

    // Create group chat
    const groupChat = new GroupChat({
      name,
      description,
      participants: allParticipants,
      admin: adminId
    });

    await groupChat.save();

    // Populate participants for response
    await groupChat.populate('participants', 'firstName lastName email');
    await groupChat.populate('admin', 'firstName lastName email');

    // Create system message for group creation
    const systemMessage = new GroupMessage({
      groupChatId: groupChat._id,
      senderId: adminId,
      text: `${req.user.firstName} created the group`,
      messageType: "system"
    });

    await systemMessage.save();

    res.status(201).json({
      message: "Group chat created successfully",
      groupChat
    });
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's group chats
export const getUserGroupChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const groupChats = await GroupChat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'firstName lastName email')
    .populate('admin', 'firstName lastName email')
    .populate('lastMessage.senderId', 'firstName lastName')
    .sort({ updatedAt: -1 });

    res.json({ groupChats });
  } catch (error) {
    console.error("Error fetching group chats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get group chat messages
export const getGroupChatMessages = async (req, res) => {
  try {
    const { groupChatId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is participant
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat || !groupChat.participants.includes(userId)) {
      return res.status(403).json({ 
        message: "Access denied to this group chat" 
      });
    }

    const messages = await GroupMessage.find({ groupChatId })
      .populate('senderId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ 
      messages: messages.reverse(),
      groupChat: {
        _id: groupChat._id,
        name: groupChat.name,
        description: groupChat.description,
        participants: groupChat.participants,
        admin: groupChat.admin
      }
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send message to group chat
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupChatId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Verify user is participant
    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat || !groupChat.participants.includes(senderId)) {
      return res.status(403).json({ 
        message: "Access denied to this group chat" 
      });
    }

    // Create message
    const message = new GroupMessage({
      groupChatId,
      senderId,
      text: text.trim()
    });

    await message.save();

    // Update group chat's last message
    groupChat.lastMessage = {
      text: text.trim(),
      senderId,
      timestamp: new Date()
    };
    await groupChat.save();

    // Populate sender info for response
    await message.populate('senderId', 'firstName lastName email');

    // Emit real-time message to group participants
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupChatId}`).emit('new_group_message', {
        message: message,
        groupChatId,
        senderId
      });
      
      // Notify all participants except sender
      groupChat.participants.forEach(participantId => {
        if (participantId.toString() !== senderId.toString()) {
          io.to(`user_${participantId}`).emit('new_group_notification', {
            groupChatId,
            groupName: groupChat.name,
            senderId,
            message: message
          });
        }
      });
    }

    res.status(201).json({
      message: "Message sent successfully",
      groupMessage: message
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add participant to group chat
export const addParticipant = async (req, res) => {
  try {
    const { groupChatId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user.id;

    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Only admin can add participants
    if (groupChat.admin.toString() !== requesterId) {
      return res.status(403).json({ 
        message: "Only group admin can add participants" 
      });
    }

    // Check if user already in group
    if (groupChat.participants.includes(userId)) {
      return res.status(400).json({ 
        message: "User is already in the group" 
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add participant
    groupChat.participants.push(userId);
    await groupChat.save();

    // Create system message
    const systemMessage = new GroupMessage({
      groupChatId,
      senderId: requesterId,
      text: `${req.user.firstName} added ${user.firstName} to the group`,
      messageType: "system"
    });

    await systemMessage.save();

    res.json({ message: "Participant added successfully" });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove participant from group chat
export const removeParticipant = async (req, res) => {
  try {
    const { groupChatId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user.id;

    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Only admin can remove participants (or users can remove themselves)
    if (groupChat.admin.toString() !== requesterId && userId !== requesterId) {
      return res.status(403).json({ 
        message: "Only group admin can remove participants" 
      });
    }

    // Cannot remove admin
    if (userId === groupChat.admin.toString()) {
      return res.status(400).json({ 
        message: "Cannot remove group admin" 
      });
    }

    // Remove participant
    groupChat.participants = groupChat.participants.filter(
      p => p.toString() !== userId
    );
    await groupChat.save();

    // Create system message
    const user = await User.findById(userId);
    const systemMessage = new GroupMessage({
      groupChatId,
      senderId: requesterId,
      text: userId === requesterId 
        ? `${user.firstName} left the group`
        : `${req.user.firstName} removed ${user.firstName} from the group`,
      messageType: "system"
    });

    await systemMessage.save();

    res.json({ message: "Participant removed successfully" });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Leave group chat
export const leaveGroupChat = async (req, res) => {
  try {
    const { groupChatId } = req.params;
    const userId = req.user.id;

    const groupChat = await GroupChat.findById(groupChatId);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Admin cannot leave (must transfer admin first)
    if (groupChat.admin.toString() === userId) {
      return res.status(400).json({ 
        message: "Admin must transfer ownership before leaving" 
      });
    }

    // Remove user from participants
    groupChat.participants = groupChat.participants.filter(
      p => p.toString() !== userId
    );
    await groupChat.save();

    // Create system message
    const systemMessage = new GroupMessage({
      groupChatId,
      senderId: userId,
      text: `${req.user.firstName} left the group`,
      messageType: "system"
    });

    await systemMessage.save();

    res.json({ message: "Left group chat successfully" });
  } catch (error) {
    console.error("Error leaving group chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};