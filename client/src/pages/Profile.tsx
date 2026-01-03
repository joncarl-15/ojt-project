import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, Shield, User as UserIcon, Lock } from 'lucide-react';
import { ImageCropper } from '../components/ImageCropper';

export const Profile: React.FC = () => {
    const { user, token, login } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Account Security State
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
        }
    }, [user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setShowCropper(true);
            setMessage(null);
            // Reset input value to allow selecting same file again
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedImage: Blob) => {
        const file = new File([croppedImage], "avatar.jpg", { type: "image/jpeg" });
        setSelectedFile(file);
        setShowCropper(false);
        // Clean up preview url
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleCancelCrop = () => {
        setShowCropper(false);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;
        setIsUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch(`/api/user/upload/${user._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Avatar updated successfully!' });
                if (data.avatar) {
                    // Update user context
                    login(token!, { ...user, avatar: data.avatar });
                }
                setSelectedFile(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred during upload' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsUpdatingProfile(true);
        setMessage(null);

        const updateData: any = {
            _id: user._id,
            username: username
        };

        if (newPassword) {
            updateData.password = newPassword;
        }

        try {
            const response = await fetch(`/api/user`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                login(token!, { ...user, username: data.username });
                setNewPassword('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred during update' });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {showCropper && previewUrl && (
                <ImageCropper
                    image={previewUrl}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                />
            )}

            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

            {/* Avatar Section */}
            <Card>
                <CardBody>
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-bold overflow-hidden border-4 border-white shadow-lg">
                                {selectedFile ? (
                                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase()
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-600">
                                <Camera size={20} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </label>
                        </div>

                        <div className="mt-4 text-center">
                            <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
                            <p className="text-gray-500">{user?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {user?.role || 'User'}
                            </span>
                        </div>

                        {selectedFile && (
                            <div className="mt-6 flex flex-col items-center space-y-3 animate-fade-in w-full max-w-xs">
                                <div className="text-sm text-gray-600">
                                    Selected: <span className="font-medium">New Avatar Image</span>
                                </div>
                                <Button onClick={handleUpload} isLoading={isUploading} className="w-full">
                                    <Upload size={18} className="mr-2" />
                                    Upload New Avatar
                                </Button>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Account Security Section */}
            <Card>
                <div className="p-4 border-b border-gray-100 flex items-center space-x-2">
                    <Shield className="text-primary-600 w-5 h-5" />
                    <h3 className="text-lg font-bold text-gray-900">Account Security</h3>
                </div>
                <CardBody>
                    <div className="space-y-4">
                        <Input
                            label="Username"
                            icon={<UserIcon size={18} />}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                        />

                        <div className="pt-2">
                            <p className="text-sm font-medium text-gray-700 mb-3">Change Password</p>
                            <Input
                                label="New Password"
                                icon={<Lock size={18} />}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (optional)"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleUpdateProfile} isLoading={isUpdatingProfile}>
                                Update Profile
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {message && (
                <div className={`p-4 rounded-lg text-sm w-full text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};
