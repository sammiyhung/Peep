import { api } from '@/lib/api/config';

// Function to send a message
const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    // Messages are now handled by Socket.io and stored automatically on the backend
    // This function is kept for compatibility but messages are sent via socket
    console.log('Message sent via socket:', { senderId, receiverId, content });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to fetch messages between two users
const fetchMessages = async (currentUserId: string, chatPartnerId: string) => {
  try {
    // Fetch messages from MongoDB backend
    const response = await api.get('/api/messages', {
      params: {
        userId1: currentUserId,
        userId2: chatPartnerId,
      },
    });

    return response.data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Function to fetch chat partner's details by user ID
const getChatPartner = async (userId: string) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data; // Return the chat partner's details (name, username, imageUrl, etc.)
  } catch (error) {
    console.error('Error fetching chat partner details:', error);
    return null;
  }
};

export { sendMessage, fetchMessages, getChatPartner };