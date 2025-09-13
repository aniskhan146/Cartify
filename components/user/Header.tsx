import React, { useState, useEffect, useRef } from 'react';
// FIX: Added type import for Variants from framer-motion
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { LogoIcon, SearchIcon, UserIcon, MenuIcon, XIcon, SunIcon, MoonIcon, BellIcon } from '../shared/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserNotification } from '../../contexts/UserNotificationContext';
import BorderBeam from './BorderBeam';
import type { Category } from '../../types';
import { formatDistanceToNow } from 'date-fns';


const navItems = [
  { name: "Home", action: "reload" },
  { name: "All Products", href: "#", action: "viewAll" },
  { name: "Shopee Mall", action: "shopeeMall" },
  { name: "Deals", href: "#promo-section" },
];

interface HeaderProps {
    onSearchClick: () => void;
    onLoginClick: () => void;
    categories: Category[];
    onCategoryClick: (categoryId: string) => void;
    onViewAllProductsClick: () => void;
    onHomeClick: () => void;
    onProfileClick: () => void;
    onShopeeMallClick: () => void;
}

interface CategoryPopupPanelProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onCategoryClick: (category: Category) => void;
}

const CategoryPopupPanel: React.FC<CategoryPopupPanelProps> = ({ isOpen, onClose, categories, onCategoryClick }) => {
    // FIX: Refactored animation props to use variants for compatibility with newer framer-motion versions.
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };
    const modalVariants = {
        hidden: { scale: 0.95, y: -20, opacity: 0 },
        visible: { scale: 1, y: 0, opacity: 1 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    // FIX: Replaced variants with inline animation props to fix framer-motion typing issue.
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex justify-center items-center"
                    onClick={onClose}
                >
                    <motion.div
                        // FIX: Replaced variants with inline animation props to fix framer-motion typing issue.
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-card rounded-xl shadow-2xl w-full max-w-3xl relative border border-border p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-foreground">All Categories</h2>
                            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Close categories panel">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => onCategoryClick(category)}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors text-center aspect-square"
                                >
                                    <img src={category.iconUrl} alt={category.name} className="h-10 w-10 object-contain" />
                                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const Header: React.FC<HeaderProps> = ({ onSearchClick, onLoginClick, categories, onCategoryClick, onViewAllProductsClick, onHomeClick, onProfileClick, onShopeeMallClick }) => {
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const { currentUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const { notifications, unreadCount, markAllAsRead } = useUserNotification();
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowHeader(false); // Scrolling down
            } else {
                setShowHeader(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleScrollTo = (id: string) => {
        const element = document.querySelector(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };
    
    const handleNavItemClick = (item: typeof navItems[0]) => {
        if (item.action === 'reload') {
            onHomeClick();
            return;
        }
        if (item.action === 'viewAll') {
            onViewAllProductsClick();
            setIsMobileMenuOpen(false);
        } else if (item.action === 'shopeeMall') {
            onShopeeMallClick();
            setIsMobileMenuOpen(false);
        } else if (item.href) {
            handleScrollTo(item.href);
        }
    };


    const handleCategoryLinkClick = (category: Category) => {
        onCategoryClick(category.id);
        setIsCategoryModalOpen(false);
    };
    
    const handleBellClick = () => {
        setIsNotificationPanelOpen(prev => !prev);
        if (unreadCount > 0) {
            markAllAsRead();
        }
    };
    
    const handleNotificationClick = () => {
        onProfileClick();
        setIsNotificationPanelOpen(false);
    };


    const menuVariants: Variants = {
        open: { clipPath: "circle(1200px at 95% 5%)", transition: { type: "spring", stiffness: 20, restDelta: 2 } },
        closed: { clipPath: "circle(24px at 95% 5%)", transition: { type: "spring", stiffness: 400, damping: 40, delay: 0.2 } },
    };
    const listVariants: Variants = {
        open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
        closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    };
    const itemVariants: Variants = {
        open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
        closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } },
    };

    // FIX: Refactored animation props to use variants for compatibility with newer framer-motion versions.
    const headerVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    const underlineVariants = {
        rest: { scaleX: 0 },
        hover: { scaleX: 1 },
    };

    const themeIconVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { y: 20, opacity: 0 },
    };


    return (
        <>
            <AnimatePresence>
                {showHeader && (
                    <motion.header
                        // FIX: Replaced variants with inline animation props to fix framer-motion typing issue.
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
                    >
                        <div className="relative border border-border backdrop-blur-xl w-full max-w-screen-2xl rounded-full flex items-center justify-between px-6 py-2 shadow-lg">
                             <BorderBeam size={200} duration={8} delay={0} />
                            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="flex items-center gap-2 cursor-pointer">
                                <LogoIcon className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg text-foreground hidden sm:inline">AYExpress</span>
                            </a>

                            <nav className="hidden md:flex flex-1 justify-center">
                                <ul className="flex space-x-6 items-center">
                                    {navItems.map((item) => (
                                        // FIX: Replaced motion component with standard li and CSS transition for compatibility.
                                        <li key={item.name} className="relative group text-sm font-medium text-muted-foreground">
                                            <button onClick={() => handleNavItemClick(item)} className="cursor-pointer hover:text-foreground transition-colors">
                                                {item.name}
                                            </button>
                                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ transformOrigin: 'center' }}/>
                                        </li>
                                    ))}
                                    <li className="relative group text-sm font-medium text-muted-foreground transition-colors">
                                        <button onClick={() => setIsCategoryModalOpen(true)} className="cursor-pointer hover:text-foreground flex items-center gap-1">
                                            Categories
                                        </button>
                                    </li>
                                </ul>
                            </nav>

                            <div className="flex items-center space-x-1">
                                 <button onClick={onSearchClick} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Search">
                                    <SearchIcon className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="p-2 text-muted-foreground hover:text-foreground"
                                    aria-label="Toggle theme"
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={theme}
                                            // FIX: Replaced variants with inline animation props to fix framer-motion typing issue.
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 20, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                                {currentUser && (
                                    <div ref={notificationRef} className="relative">
                                        <button onClick={handleBellClick} className="relative p-2 text-muted-foreground hover:text-foreground" aria-label="Notifications">
                                            <BellIcon className="h-5 w-5" />
                                            <AnimatePresence>
                                                {unreadCount > 0 && (
                                                    <motion.span
                                                        // FIX: Replaced animation props with spread object to fix framer-motion typing issue.
                                                        {...{
                                                            initial: { scale: 0 },
                                                            animate: { scale: 1 },
                                                            exit: { scale: 0 },
                                                        }}
                                                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                                                    >
                                                        {unreadCount}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                        <AnimatePresence>
                                            {isNotificationPanelOpen && (
                                                 <motion.div
                                                    // FIX: Replaced animation props with spread object to fix framer-motion typing issue.
                                                    {...{
                                                        initial: { opacity: 0, y: -10 },
                                                        animate: { opacity: 1, y: 0 },
                                                        exit: { opacity: 0, y: -10 },
                                                    }}
                                                    className="absolute right-0 mt-3 w-80 bg-card rounded-lg shadow-lg z-50 ring-1 ring-border text-sm"
                                                 >
                                                    <div className="p-3 font-semibold border-b border-border text-foreground">Notifications</div>
                                                    <div className="max-h-80 overflow-y-auto">
                                                        {notifications.length > 0 ? (
                                                            notifications.map(notif => (
                                                                <button key={notif.id} onClick={handleNotificationClick} className="flex items-start gap-3 p-3 border-b border-border last:border-b-0 hover:bg-accent w-full text-left">
                                                                    <div className="flex-shrink-0 mt-1">
                                                                      <BellIcon className="h-5 w-5 text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-foreground">{notif.message}</p>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                                        </p>
                                                                    </div>
                                                                     {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0 self-center" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="p-4 text-center text-muted-foreground">You have no notifications yet.</p>
                                                        )}
                                                    </div>
                                                 </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                {!currentUser && (
                                    <button onClick={onLoginClick} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Login">
                                        <UserIcon className="h-5 w-5" />
                                    </button>
                                )}
                                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                    <MenuIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>
            
            <CategoryPopupPanel 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                onCategoryClick={handleCategoryLinkClick}
            />
            
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        // FIX: Replaced animation props with spread object to fix framer-motion typing issue.
                        {...{
                            initial: "closed",
                            animate: "open",
                            exit: "closed",
                            variants: menuVariants,
                        }}
                        className="fixed inset-0 z-[100] bg-background md:hidden flex flex-col items-center justify-center">
                         <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 text-foreground" aria-label="Close menu">
                            <XIcon className="h-8 w-8" />
                        </button>
                        <motion.ul
                            // FIX: Replaced variants prop with spread object to fix framer-motion typing issue.
                            {...{ variants: listVariants }}
                            className="flex flex-col items-center justify-center h-full space-y-8">
                            {navItems.map((item) => (
                                <motion.li key={item.name}
                                    // FIX: Replaced variants prop with spread object to fix framer-motion typing issue.
                                    {...{ variants: itemVariants }}>
                                    <a onClick={() => handleNavItemClick(item)} className="text-2xl font-bold text-foreground cursor-pointer">
                                        {item.name}
                                    </a>
                                </motion.li>
                            ))}
                            <motion.li
                                // FIX: Replaced variants prop with spread object to fix framer-motion typing issue.
                                {...{ variants: itemVariants }}>
                                <a onClick={() => { setIsCategoryModalOpen(true); setIsMobileMenuOpen(false); }} className="text-2xl font-bold text-foreground cursor-pointer">
                                    Categories
                                </a>
                            </motion.li>
                        </motion.ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;