import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
    userId: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, userRole, userId }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const getRoleContent = (role: string) => {
        const content = {
            student: {
                title: 'Student',
                command: "Slide the side panel to access all features. Dashboard, Messages, Tasks, and Documents are just a click away.",
                connect: "Contact your coordinator directly regarding your internship concerns.",
                tasks: "View and submit your assigned tasks on the go.",
                docs: "Upload your requirements easily and receive email notifications upon submission."
            },
            coordinator: {
                title: 'Coordinator',
                command: "Your central hub. Post announcements to update everyone, track overall progress, and manage your students.",
                connect: "Contact your students directly to monitor their progress and answer queries.",
                tasks: "Take full control. Create detailed tasks, set requirements, and assign them to your students effortlessly.",
                docs: "Streamline your workflow. Review student submissions and manage internship documents in one place."
            },
            admin: {
                title: 'Admin',
                command: "System Overview. Manage all Users, Companies, Program Requirements, and Monitor Enrollment status.",
                tasks: "Oversee all task assignments and monitor completion rates across the program.",
                docs: "Access and manage all system-wide documents and archive records for safeguards."
            }
        };
        return content[role as keyof typeof content] || content.student;
    };

    const roleContent = getRoleContent(userRole);

    const slides = [
        {
            title: `Hello ${roleContent.title}!`,
            description: "Welcome to the OJT Monitoring System. Let's take a quick tour of your new workspace.",
            emoji: "👋",
            bgColor: "bg-gradient-to-br from-emerald-100 to-teal-50"
        },
        {
            title: "Your Command Center",
            description: roleContent.command,
            emoji: "🎛️",
            bgColor: "bg-gradient-to-br from-indigo-100 to-violet-50"
        },
        {
            title: "Stay Connected",
            description: (roleContent as any).connect,
            emoji: "💬",
            bgColor: "bg-gradient-to-br from-blue-100 to-cyan-50"
        },
        {
            title: "Task Management",
            description: roleContent.tasks,
            emoji: "✅",
            bgColor: "bg-gradient-to-br from-emerald-100 to-green-50"
        },
        {
            title: "Document Handling",
            description: roleContent.docs,
            emoji: "📂",
            bgColor: "bg-gradient-to-br from-amber-100 to-orange-50"
        }
    ].filter(slide => slide.description);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    const handleFinish = () => {
        if (dontShowAgain) {
            localStorage.setItem(`ojt_tutorial_seen_${userId}`, 'true');
        }
        onClose();
    };

    const slide = slides[currentSlide];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-scale-in">

                {/* Close Button (Skip) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-full transition-colors z-20"
                >
                    <X size={20} />
                </button>

                {/* Image or Icon Area - Full Bleed */}
                <div className={`w-full aspect-[16/9] flex items-center justify-center relative overflow-hidden ${slide.bgColor || 'bg-gray-50'}`}>
                    <div className="text-8xl animate-bounce drop-shadow-md filter transform hover:scale-110 transition-transform duration-500 cursor-pointer">
                        {slide.emoji}
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center text-center px-8 pt-8 pb-4 bg-white">
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">{slide.title}</h2>
                    <p className="text-slate-600 leading-relaxed max-w-sm text-lg">
                        {slide.description}
                    </p>
                </div>

                {/* Footer / Controls */}
                <div className="p-8 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        {/* Dots Indicator */}
                        <div className="flex gap-2.5">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-indigo-600 w-8' : 'bg-slate-200 w-2.5'}`}
                                />
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            {currentSlide > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
                            >
                                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                                {currentSlide === slides.length - 1 ? <Check size={20} /> : <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Don't Show Again (Only on last slide) */}
                    <div className={`mt-4 flex items-center justify-center gap-2 transition-opacity duration-300 ${currentSlide === slides.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'}`}>
                        <input
                            type="checkbox"
                            id="dontShow"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="dontShow" className="text-xs text-gray-400 cursor-pointer select-none font-medium">
                            Don't show this tutorial again
                        </label>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
