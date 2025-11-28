import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MessageCircle, ExternalLink, Image, FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';
import companyLogo from '@/assets/integer.webp';
import { sanitizeName, sanitizeEmail, sanitizeText } from '@/utils/inputSanitizer';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            return;
        }

        // Sanitize inputs
        const sanitizedName = sanitizeName(formData.name);
        const sanitizedEmail = sanitizeEmail(formData.email);
        const sanitizedMessage = sanitizeText(formData.message, 2000);

        if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
            alert('Please enter valid information. Avoid special characters or scripts.');
            return;
        }

        setIsSubmitting(true);
        try {
            const recipientEmail = 'integer.io.ai@gmail.com';
            const subject = encodeURIComponent(`Contact Form: Message from ${sanitizedName}`);
            const body = encodeURIComponent(
                `Name: ${sanitizedName}\nEmail: ${sanitizedEmail}\n\nMessage:\n${sanitizedMessage}\n\n---\nSent via chatz.IO Contact Page`
            );
            const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
            const link = document.createElement('a');
            link.href = mailtoLink;
            link.click();

            setFormData({ name: '', email: '', message: '' });
            setIsSubmitting(false);
        } catch (error) {
            // console.error('Failed to open email client:', error);
            setIsSubmitting(false);
        }
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent("Hi, I'm interested in AI integration services for my business");
        window.open(`https://wa.me/918015355914?text=${message}`, '_blank');
    };

    const handleVisitWebsite = () => {
        window.open('https://integer-io.netlify.app/', '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal - Responsive scrolling */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* PC: No scrollbar, Mobile: Scrollbar */}
                        <div className="w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto md:overflow-y-hidden bg-white rounded-3xl shadow-2xl border-2 border-white/40">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-3xl px-6 py-3 flex items-center justify-between z-10">
                                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                                    Contact Us 📞
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                                    title="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content - PC: Grid layout, Mobile: Stack */}
                            <div className="p-4 md:p-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Left Column */}
                                    <div className="space-y-3">
                                        {/* Company Info */}
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3 border-2 border-blue-200">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <img src={companyLogo} alt="Integer.IO Logo" className="w-19 h-11 object-contain" />
                                                <div>
                                                    <h3 className="text-base font-bold text-blue-600">Integer.IO</h3>
                                                    <p className="text-[10px] text-slate-700">WEB & AI Services</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-700">
                                                Need this type of chatbot for your website or company? Contact us for affordable AI integration services tailored to your business needs.
                                            </p>
                                        </div>

                                        {/* Quick Contact Options */}
                                        <div className="space-y-2">
                                            {/* WhatsApp */}
                                            <button
                                                onClick={handleWhatsApp}
                                                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-2 border-emerald-200 hover:border-emerald-300 flex items-center space-x-3 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                                                    <MessageCircle size={16} className="text-white" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="font-bold text-xs text-slate-800">Whatsapp Support</div>
                                                    <div className="text-[10px] text-slate-600">Available 24/7</div>
                                                </div>
                                            </button>

                                            {/* Email */}
                                            <a
                                                href="mailto:integer.ai.io@gmail.com"
                                                className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 flex items-center space-x-3 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={16} className="text-white" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="font-bold text-xs text-slate-800">Email Support</div>
                                                    <div className="text-[10px] text-slate-600">integer.ai.io@gmail.com</div>
                                                </div>
                                            </a>

                                            {/* Website */}
                                            <button
                                                onClick={handleVisitWebsite}
                                                className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-300 flex items-center space-x-3 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                    <ExternalLink size={16} className="text-white" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="font-bold text-xs text-slate-800">Visit Website</div>
                                                    <div className="text-[10px] text-slate-600">Learn more</div>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Future Updates */}
                                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-3 border-2 border-orange-200">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Sparkles size={16} className="text-orange-600" />
                                                <h4 className="font-bold text-sm text-orange-800">Future Updates 🚀</h4>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center space-x-2">
                                                    <Image size={14} className="text-orange-600 flex-shrink-0" />
                                                    <p className="text-[10px] text-slate-700">Image Recognition & Analysis</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Sparkles size={14} className="text-orange-600 flex-shrink-0" />
                                                    <p className="text-[10px] text-slate-700">AI Image Generation</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FileText size={14} className="text-orange-600 flex-shrink-0" />
                                                    <p className="text-[10px] text-slate-700">Document Analysis & Summary</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Contact Form */}
                                    <div className="bg-white/70 rounded-2xl p-3 border-2 border-slate-200">
                                        {/* Feedback Form Heading */}
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Mail size={18} className="text-blue-600" />
                                            <h4 className="font-bold text-base text-slate-800">Feedback Form</h4>
                                        </div>

                                        <h5 className="font-semibold text-xs text-slate-600 mb-2">Send us a Message</h5>
                                        <form onSubmit={handleSubmit} className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Name *"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-300 focus:border-blue-500 rounded-lg text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
                                                required
                                                disabled={isSubmitting}
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email *"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-300 focus:border-blue-500 rounded-lg text-slate-900 placeholder:text-slate-500 outline-none transition-colors"
                                                required
                                                disabled={isSubmitting}
                                            />
                                            <textarea
                                                placeholder="How can we help you? *"
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-3 py-2 text-sm h-32 md:h-40 bg-white border-2 border-slate-300 focus:border-blue-500 rounded-lg text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-none"
                                                required
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-2.5 text-sm bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-700 hover:via-cyan-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContactModal;
