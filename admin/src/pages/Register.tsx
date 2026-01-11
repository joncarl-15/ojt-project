import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardBody, CardFooter } from '../components/Card';
import { Mail, Lock, User } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            // Note: Proxy is set up in vite.config.ts but we use API_BASE_URL for production
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    userName: formData.userName,
                    email: formData.email,
                    password: formData.password,
                    role: 'admin',
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Login the user immediately separate from saving the token
                // We use the data from the response to login
                login(data.data.accessToken, data.data.user);
                navigate('/success');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Registration</h1>
                    <p className="mt-2 text-gray-600">Create your administrative account</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Input
                                label="Username"
                                name="userName"
                                placeholder="johndoe"
                                value={formData.userName}
                                onChange={handleChange}
                                icon={<User size={20} />}
                                required
                            />

                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                icon={<Mail size={20} />}
                                required
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                icon={<Lock size={20} />}
                                required
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                icon={<Lock size={20} />}
                                required
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}
                        </CardBody>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Create Admin Account
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};
