import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, Shield, Trash2 } from 'lucide-react';
import { ImageCropper } from '../components/ImageCropper';
import { API_BASE_URL } from '../config';

export const Profile: React.FC = () => {
    const { user, token, login } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Account Security State
    const [username, setUsername] = useState('');

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password Reset Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordStep, setPasswordStep] = useState<1 | 2 | 3>(1);
    const [resetEmail, setResetEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    // Username Change Modal State
    const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState(''); // Password for username change verification

    useEffect(() => {
        if (user) {
            setUsername(user.username);
        }
    }, [user]);

    const handlePasswordModalOpen = () => {
        setIsPasswordModalOpen(true);
        setPasswordStep(1);
        setVerificationCode('');
        setResetNewPassword('');
        setResetEmail('');
        setMessage(null);
    };

    const handleInitiateReset = async () => {
        setIsResetting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/initiate-password-reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setResetEmail(data.email);
                setPasswordStep(2);
                setMessage({ type: 'success', text: 'Verification code sent to your email.' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to send code.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setIsResetting(false);
        }
    };

    const handleVerifyCode = async () => {
        setIsResetting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, code: verificationCode })
            });
            const data = await response.json();
            if (response.ok) {
                setPasswordStep(3);
                setMessage({ type: 'success', text: 'Code verified. Enter new password.' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Invalid code.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setIsResetting(false);
        }
    };

    const handleResetPasswordFinal = async () => {
        setIsResetting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, code: verificationCode, newPassword: resetNewPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setIsPasswordModalOpen(false);
                setMessage({ type: 'success', text: 'Password changed successfully!' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setIsResetting(false);
        }
    };

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
            const response = await fetch(`${API_BASE_URL}/user/upload/${user._id}`, {
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

    const handleDeleteAccount = async () => {
        if (!confirm('Are you ABSOLUTELY SURE you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/${user?._id}/permanent`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Account deleted successfully.');
                // Perform logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('An error occurred while deleting the account.');
        }
    };

    const handleUpdateUsername = async () => {
        if (!user || !newUsername || !usernamePassword) return;
        setIsUpdatingProfile(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    _id: user._id,
                    userName: newUsername, // Note: backend expects 'userName' but usually maps 'username' too. Checking model: 'userName'. Client `user` has 'username'.
                    // Wait, the backend model uses `userName` but the login response might be mapping it. 
                    // Let's check `UserContext`. 
                    // The `userController` checks `req.body.userName`.
                    // So I should send `userName`.
                    currentPassword: usernamePassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Username updated successfully!' });
                login(token!, { ...user, username: data.userName || newUsername });
                setIsUsernameModalOpen(false);
                setNewUsername('');
                setUsernamePassword('');
                setUsername(data.userName || newUsername);
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
                // Keep modal open to show error?
                // But error is shown in main page 'message'. Better to show it in modal or alert.
                // The current component design uses a global 'message' state.
                // We'll let it show there, but maybe also alert if modal closes?
                // Actually, if we close modal, users might miss the error if they don't look at the profile page.
                // Better: don't close modal on error.
                // But `message` is rendered outside modal. 
                // I'll assume users will see the red message.
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
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Username</p>
                                <p className="text-xs text-gray-500">{username}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsUsernameModalOpen(true)}>
                                Change Username
                            </Button>
                        </div>

                        {/* Current Password field removed from here */}

                        <div className="pt-2 border-t border-gray-100 mt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Password</p>
                                    <p className="text-xs text-gray-500">Change your password securely</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handlePasswordModalOpen}>
                                    Change Password
                                </Button>
                            </div>
                        </div>

                        {/* Update Profile button removed */}
                    </div>
                </CardBody>
            </Card>

            {/* Danger Zone */}
            {user?.role === 'admin' && (
                <Card className="border-red-200">
                    <div className="p-4 border-b border-red-50 flex items-center space-x-2 bg-red-50/50">
                        <Trash2 className="text-red-600 w-5 h-5" />
                        <h3 className="text-lg font-bold text-gray-900">Danger Zone</h3>
                    </div>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">Delete Account</h4>
                                <p className="text-sm text-gray-500">Permanently remove your account and all of its data.</p>
                            </div>
                            <Button
                                variant="danger"
                                onClick={handleDeleteAccount}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Delete Account
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {message && (
                <div className={`p-4 rounded-lg text-sm w-full text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Password Reset Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
            >
                <div className="space-y-4">
                    {passwordStep === 1 && (
                        <div className="text-center space-y-4">
                            <div className="p-3 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-blue-600">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Security Verification</h4>
                                <p className="text-sm text-gray-500 mt-1">To change your password, we need to send a verification code to your email.</p>
                            </div>
                            <Button onClick={handleInitiateReset} isLoading={isResetting} className="w-full">
                                Send Verification Code
                            </Button>
                        </div>
                    )}

                    {passwordStep === 2 && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-900">Enter Verification Code</h4>
                                <p className="text-sm text-gray-500 mt-1">Sent to {resetEmail}</p>
                            </div>
                            <Input
                                label="Verification Code"
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="text-center letter-spacing-2 text-sm"
                            />
                            <Button onClick={handleVerifyCode} isLoading={isResetting} className="w-full">
                                Verify Code
                            </Button>
                        </div>
                    )}

                    {passwordStep === 3 && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h4 className="font-semibold text-gray-900">Set New Password</h4>
                            </div>
                            <Input
                                type="password"
                                label="New Password"
                                placeholder="Enter new password"
                                value={resetNewPassword}
                                onChange={(e) => setResetNewPassword(e.target.value)}
                            />
                            <Button onClick={handleResetPasswordFinal} isLoading={isResetting} className="w-full">
                                Reset Password
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Username Change Modal */}
            <Modal
                isOpen={isUsernameModalOpen}
                onClose={() => setIsUsernameModalOpen(false)}
                title="Change Username"
            >
                <div className="space-y-4">
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200">
                        <p className="font-semibold flex items-center gap-2"><Shield size={16} /> Important</p>
                        <p className="mt-1">For security reasons, you can only change your username once every 30 days. You will need to provide your current password.</p>
                    </div>

                    <Input
                        label="New Username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter new username"
                    />

                    <Input
                        label="Current Password"
                        type="password"
                        value={usernamePassword}
                        onChange={(e) => setUsernamePassword(e.target.value)}
                        placeholder="Confirm with password"
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setIsUsernameModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateUsername}
                            isLoading={isUpdatingProfile}
                            disabled={!newUsername || !usernamePassword}
                        >
                            Update Username
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
