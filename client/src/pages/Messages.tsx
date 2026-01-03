import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Search, Send, User, MessageSquare, Users, Image as ImageIcon, X, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Message {
    _id: string;
    sender: {
        _id: string;
        firstName: string;
        lastName: string;
        role: string;
        avatar?: string;
    };
    receiver: {
        _id: string;
        firstName?: string; // For User
        lastName?: string;  // For User
        name?: string;      // For Conversation
        role?: string;      // For User
        type?: string;      // For Conversation
    };
    receiverModel: 'User' | 'Conversation';
    content?: string;
    image?: string;
    createdAt: string;
    isRead: boolean;
}

interface Conversation {
    id: string; // User ID or Conversation ID
    type: 'direct' | 'group';
    name: string;
    role?: string; // Only for direct
    lastMessage?: {
        text: string;
        timestamp: string;
        isOwn: boolean;
    };
    unreadCount: number;
}

export const Messages: React.FC = () => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);

    // Initialize Socket
    useEffect(() => {
        if (!user) return;

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join', user._id);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // Fetch Messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch('/api/message', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user && token) {
            fetchMessages();
        }
    }, [user, token]);

    // Fetch Suggested Contacts
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user || !user.program || !token) return;

            let query = {};
            if (user.role === 'student') {
                query = { role: 'coordinator', program: user.program };
            } else if (user.role === 'coordinator') {
                query = { role: 'student', program: user.program };
            } else {
                return;
            }

            try {
                const response = await fetch('/api/user/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(query)
                });
                if (response.ok) {
                    const data = await response.json();
                    // Filter out already existing conversations to avoid duplicates in view, or keep them?
                    // User asked for "contacts list", usually separate.
                    // But if I click a contact, it should open the conversation.
                    // Let's keep all valid contacts.
                    setSuggestedContacts(data.filter((u: any) => u._id !== user._id));
                }
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            }
        };

        fetchContacts();
    }, [user, token]);

    // Process messages into conversations
    useEffect(() => {
        if (!user || !messages) return;

        const conversationMap = new Map<string, Conversation>();

        messages.forEach(msg => {
            const isOwn = msg.sender._id === user._id;

            let conversationId: string;
            let conversationName: string;
            let conversationType: 'direct' | 'group' = 'direct';
            let conversationRole: string | undefined;

            if (msg.receiverModel === 'Conversation') {
                conversationId = msg.receiver._id;
                conversationName = msg.receiver.name || 'Group Chat';
                conversationType = 'group';
            } else {
                // Direct message
                if (isOwn) {
                    conversationId = msg.receiver._id;
                    conversationName = `${msg.receiver.firstName} ${msg.receiver.lastName}`;
                    conversationRole = msg.receiver.role;
                } else {
                    conversationId = msg.sender._id;
                    conversationName = `${msg.sender.firstName} ${msg.sender.lastName}`;
                    conversationRole = msg.sender.role;
                }
            }

            const existingConv = conversationMap.get(conversationId);
            const messageDate = new Date(msg.createdAt).toISOString();
            const isNewer = !existingConv || new Date(messageDate) > new Date(existingConv.lastMessage?.timestamp || 0);

            if (!existingConv) {
                conversationMap.set(conversationId, {
                    id: conversationId,
                    type: conversationType,
                    name: conversationName,
                    role: conversationRole,
                    lastMessage: {
                        text: msg.content || (msg.image ? 'Sent an image' : ''),
                        timestamp: messageDate,
                        isOwn
                    },
                    unreadCount: (!isOwn && !msg.isRead) ? 1 : 0
                });
            } else {
                if (isNewer) {
                    existingConv.lastMessage = {
                        text: msg.content || (msg.image ? 'Sent an image' : ''),
                        timestamp: messageDate,
                        isOwn
                    };
                }
                if (!isOwn && !msg.isRead) {
                    existingConv.unreadCount += 1;
                }
            }
        });

        setConversations(Array.from(conversationMap.values()).sort((a, b) =>
            new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()
        ));

    }, [messages, user]);

    // Filter conversations
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredConversations(conversations);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            setFilteredConversations(conversations.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                (c.role && c.role.toLowerCase().includes(lowerTerm))
            ));
        }
    }, [searchTerm, conversations]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversationId, messages]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('newMessage', (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('messageSent', (message: Message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        });

        socket.on('messageUpdated', (data: { messageId: string, content: string }) => {
            setMessages(prev => prev.map(msg =>
                msg._id === data.messageId ? { ...msg, content: data.content } : msg
            ));
        });

        socket.on('messageDeleted', (data: { messageId: string }) => {
            setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageSent');
            socket.off('messageUpdated');
            socket.off('messageDeleted');
        };
    }, [socket]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!messageInput.trim() && !imageFile) || !selectedConversationId || !user) return;

        const selectedConv = conversations.find(c => c.id === selectedConversationId);

        let receiverModel: 'User' | 'Conversation' = 'User';
        if (selectedConv?.type === 'group') {
            receiverModel = 'Conversation';
        }

        // Optimistic Update
        const tempId = Date.now().toString();
        const optimisticMessage: Message = {
            _id: tempId,
            sender: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar
            },
            receiver: {
                _id: selectedConversationId,
                name: selectedConv?.name
            },
            receiverModel: receiverModel,
            content: messageInput,
            image: imagePreview || undefined,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageInput('');
        handleRemoveImage();

        try {
            let imageUrl = '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);

                const uploadResponse = await fetch('/api/message/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    imageUrl = uploadData.imageUrl;
                }
            }

            const response = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiver: selectedConversationId,
                    receiverModel: receiverModel,
                    content: optimisticMessage.content,
                    image: imageUrl || undefined
                })
            });

            if (response.ok) {
                const sentMessage = await response.json();
                setMessages(prev => prev.map(msg => msg._id === tempId ? sentMessage : msg));
            } else {
                // Remove optimistic message if failed
                setMessages(prev => prev.filter(msg => msg._id !== tempId));
            }
        } catch (error) {
            console.error("Failed to send message", error);
            // Remove optimistic message if failed
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };

    const handleUpdateMessage = async (messageId: string) => {
        if (!editContent.trim()) return;
        try {
            const response = await fetch(`/api/message/${messageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            if (response.ok) {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, content: editContent } : msg
                ));
                setEditingMessageId(null);
                setEditContent('');
            }
        } catch (error) {
            console.error("Failed to update message", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;

        // Optimistic update: Remove immediately
        const messageToDelete = messages.find(m => m._id === messageId);
        setMessages(prev => prev.filter(msg => msg._id !== messageId));

        // If it's a temp ID (not 24 hex chars), don't call server
        if (messageId.length !== 24) {
            return;
        }

        try {
            const response = await fetch(`/api/message/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Revert if failed
                if (messageToDelete) {
                    setMessages(prev => [...prev, messageToDelete].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
                    alert("Failed to delete message");
                }
            }
        } catch (error) {
            console.error("Failed to delete message", error);
            // Revert if failed
            if (messageToDelete) {
                setMessages(prev => [...prev, messageToDelete].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
                alert("Failed to delete message");
            }
        }
    };


    const getConversationMessages = () => {
        if (!selectedConversationId || !user) return [];
        const selectedConv = conversations.find(c => c.id === selectedConversationId);

        if (selectedConv?.type === 'group') {
            return messages.filter(msg =>
                msg.receiverModel === 'Conversation' && msg.receiver._id === selectedConversationId
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        return messages.filter(msg =>
            (msg.sender._id === user._id && msg.receiver._id === selectedConversationId && msg.receiverModel !== 'Conversation') ||
            (msg.sender._id === selectedConversationId && msg.receiver._id === user._id && msg.receiverModel !== 'Conversation')
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Construct display object for header
    let headerDisplay = { name: 'Unknown', role: 'Unknown' };
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    if (selectedConversation) {
        headerDisplay = { name: selectedConversation.name, role: selectedConversation.role || (selectedConversation.type === 'group' ? 'Group Chat' : 'User') };
    } else {
        const selectedContact = suggestedContacts.find(c => c._id === selectedConversationId);
        if (selectedContact) {
            headerDisplay = { name: `${selectedContact.firstName} ${selectedContact.lastName}`, role: selectedContact.role };
        }
    }

    const currentMessages = getConversationMessages();

    // Filter contacts that DON'T have a conversation yet? Or just show all?
    // User requested "Show all ... on top".
    // Let's show "Contacts" section.

    return (
        <div className="h-[calc(100dvh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.24))] flex flex-col">
            <div className={`mb-4 ${selectedConversationId ? 'hidden md:block' : ''}`}>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>

            <Card className="flex-1 flex overflow-hidden border border-gray-100 shadow-sm relative">
                {/* Sidebar */}
                <div className={`w-full md:w-80 border-r border-gray-100 flex-col bg-white ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100">
                        <Input
                            placeholder="Search user or group..."
                            icon={<Search size={18} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-gray-100 focus:border-green-500"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto">

                        {/* Suggested Contacts Section */}
                        {suggestedContacts.length > 0 && !searchTerm && (
                            <div className="mb-2">
                                <div className="px-4 py-2 bg-gray-50/50 sticky top-0 backdrop-blur-sm">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {user?.role === 'student' ? 'Coordinators' : 'Students'}
                                    </h3>
                                </div>
                                {suggestedContacts.map(contact => (
                                    <div
                                        key={contact._id}
                                        onClick={() => setSelectedConversationId(contact._id)}
                                        className={`px-4 py-2 cursor-pointer transition-colors flex items-center gap-3 ${selectedConversationId === contact._id ? 'bg-green-50 border-r-2 border-green-500' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                                            {contact.firstName[0]}{contact.lastName[0]}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${selectedConversationId === contact._id ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {contact.firstName} {contact.lastName}
                                            </p>
                                            <p className="text-[10px] text-gray-500 capitalize">{contact.program || contact.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="px-4 py-2 bg-gray-50/50 sticky top-0 backdrop-blur-sm">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Conversations</h3>
                        </div>
                        {filteredConversations.map(conversation => (
                            <div
                                key={conversation.id}
                                onClick={() => setSelectedConversationId(conversation.id)}
                                className={`px-4 py-3 cursor-pointer transition-colors ${selectedConversationId === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {conversation.type === 'group' ? <Users size={16} className="text-gray-500" /> : null}
                                        <span className={`font-semibold text-sm ${selectedConversationId === conversation.id ? 'text-gray-900' : 'text-gray-900'}`}>{conversation.name}</span>
                                    </div>
                                    <span className="text-xs text-green-600 font-medium capitalize">{conversation.role || 'Group'}</span>
                                </div>
                                <p className={`text-sm ${selectedConversationId === conversation.id ? 'text-green-600' : 'text-gray-500'} truncate`}>
                                    {conversation.type === 'group' && conversation.lastMessage && !conversation.lastMessage.isOwn ? 'Someone: ' : ''}
                                    {conversation.lastMessage?.text}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-green-600">
                                        {conversation.lastMessage?.timestamp && new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-xl">
                                            {conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredConversations.length === 0 && !isLoading && suggestedContacts.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                No conversations found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex-col bg-white ${selectedConversationId ? 'flex' : 'hidden md:flex'}`}>
                    {selectedConversationId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                    {(headerDisplay.role === 'Group Chat' || headerDisplay.role.includes('Group')) ? <Users size={20} /> : <User size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm md:text-lg">{headerDisplay.name}</h3>
                                    <p className="text-[10px] md:text-xs text-green-600 capitalize">{headerDisplay.role}</p>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                {currentMessages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                )}
                                {currentMessages.map(message => {
                                    const isOwn = message.sender._id === user?._id;
                                    return (
                                        <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[85%] md:max-w-[70%] relative group">
                                                {!isOwn && selectedConversation?.type === 'group' && (
                                                    <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender.firstName}</p>
                                                )}
                                                <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-green-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                                    {message.image && (
                                                        <div className="mb-2 -mx-2 mt-[-4px]">
                                                            <img
                                                                src={message.image}
                                                                alt="Attached"
                                                                className="max-w-full rounded-lg max-h-32 md:max-h-60 object-contain bg-black/5 cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => setSelectedImage(message.image || null)}
                                                            />
                                                        </div>
                                                    )}

                                                    {editingMessageId === message._id ? (
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                value={editContent}
                                                                onChange={e => setEditContent(e.target.value)}
                                                                className="text-black text-xs md:text-sm p-1 rounded w-full border border-gray-300 outline-none"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleUpdateMessage(message._id)} className="text-[10px] md:text-xs text-white underline font-bold whitespace-nowrap">Save</button>
                                                            <button onClick={() => setEditingMessageId(null)} className="text-[10px] md:text-xs text-white underline whitespace-nowrap">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {message.content && <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>}
                                                            <span className={`text-[10px] block mt-1 ${isOwn ? 'text-green-100' : 'text-gray-400'}`}>
                                                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {isOwn && !editingMessageId && (
                                                    <div className="hidden group-hover:flex absolute top-0 -left-20 bg-white shadow-md rounded-lg p-1 gap-1 z-10">
                                                        <button onClick={() => {
                                                            setEditingMessageId(message._id);
                                                            setEditContent(message.content || '');
                                                        }} className="text-xs text-blue-600 px-2 py-1 hover:bg-gray-100 rounded">Edit</button>
                                                        <button onClick={() => handleDeleteMessage(message._id)} className="text-xs text-red-600 px-2 py-1 hover:bg-gray-100 rounded">Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                                {imagePreview && (
                                    <div className="mb-2 relative inline-block">
                                        <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!messageInput.trim() && !imageFile}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Select a conversation to start chatting.</p>
                        </div>
                    )}
                </div>
            </Card>
            {/* Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
                        title="Close"
                    >
                        <X size={32} />
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (!selectedImage) return;
                            try {
                                const response = await fetch(selectedImage);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `image-${Date.now()}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error("Failed to download image", error);
                                window.open(selectedImage, '_blank');
                            }
                        }}
                        className="absolute top-4 right-16 text-white hover:text-gray-300 p-2"
                        title="Download"
                    >
                        <Download size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
