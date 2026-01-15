import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Mail, Lock, User, Briefcase, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        program: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    userName: formData.userName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    program: formData.program
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                navigate('/login');
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
        <div className="min-h-[100dvh] flex bg-slate-50">
            {/* Left Side - Brand & Visuals (Hidden on mobile) */}
            {/* Left Side - Brand & Visuals (Hidden on mobile) */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-5/12 relative bg-emerald-950 overflow-hidden items-center justify-center p-12"
            >
                {/* Main Gradient Overlay - Deep Teal/Emerald */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-emerald-950/95 z-10 mix-blend-multiply" />

                {/* Secondary Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent z-10 opacity-60" />

                {/* Background Image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay grayscale z-0" />

                {/* Floating Shapes Animation */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: 180 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/3 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] z-10"
                />

                <div className="relative z-20 text-white max-w-md space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-sm">Join the Future of <br /> Training Management</h1>
                        <p className="text-emerald-50/90 text-lg font-light tracking-wide">Create your account to start managing your OJT requirements and progress efficiently.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            'Track real-time progress',
                            'Seamless document uploads',
                            'Direct coordination channel',
                            'Automated notifications'
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center space-x-3 text-emerald-50"
                            >
                                <CheckCircle size={20} className="text-emerald-400" />
                                <span>{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)] -z-10 lg:hidden" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center lg:text-left mb-8">
                        <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                            <ArrowRight className="rotate-180 mr-1" size={16} /> Back to Login
                        </Link>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create your account</h2>
                        <p className="text-slate-500 mt-2">Fill in your details to get started.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="First Name"
                                name="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                className="bg-white"
                            />
                            <Input
                                label="Last Name"
                                name="lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                className="bg-white"
                            />
                        </div>

                        <Input
                            label="Username"
                            name="userName"
                            placeholder="johndoe"
                            value={formData.userName}
                            onChange={handleChange}
                            icon={<User size={18} />}
                            required
                            className="bg-white"
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            icon={<Mail size={18} />}
                            required
                            className="bg-white"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Role</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Briefcase size={18} />
                                    </div>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:ring-primary-500 focus:border-primary-500 pl-10 py-2.5 bg-white text-slate-900 appearance-none"
                                    >
                                        <option value="student">Student</option>
                                        <option value="coordinator">Coordinator</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Program</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <GraduationCap size={18} />
                                    </div>
                                    <select
                                        name="program"
                                        value={formData.program}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:ring-primary-500 focus:border-primary-500 pl-10 py-2.5 bg-white text-slate-900 appearance-none"
                                        required
                                    >
                                        <option value="" disabled>Select Program</option>
                                        <option value="bsit">BS Information Technology (BSIT)</option>
                                        <option value="bsba">BS Business Administration (BSBA)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                icon={<Lock size={18} />}
                                required
                                className="bg-white"
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                icon={<Lock size={18} />}
                                required
                                className="bg-white"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                {error}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all"
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            By creating an account, you agree to our{' '}
                            <a href="#" className="underline hover:text-slate-800">Terms of Service</a> and{' '}
                            <a href="#" className="underline hover:text-slate-800">Privacy Policy</a>.
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

