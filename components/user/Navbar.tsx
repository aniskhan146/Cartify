import React, { useState } from 'react';
import { ShoppingCartIcon, UserIcon, SearchIcon, LogOutIcon, MenuIcon, XIcon, CameraIcon, HeartIcon } from '../shared/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

interface NavbarProps {
  onLoginClick: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onHomeClick: () => void;
  onCartClick: () => void;
  onVisionClick: () => void;
  onWishlistClick: () => void;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, searchQuery, onSearchChange, onClearSearch, onHomeClick, onCartClick, onVisionClick, onWishlistClick, onProfileClick }) => {
  const { currentUser, logout } = useAuth();
  const { cartItemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
      // Optional: show a success message
    } catch (error) {
      console.error("Failed to log out", error);
      // Optional: show an error message
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="text-2xl font-bold text-foreground">Cartify</a>
          </div>
          <nav className="hidden md:flex items-center ml-10 space-x-8">
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Products</a>
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative hidden sm:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={onSearchChange}
                className="bg-secondary pl-10 pr-10 py-2 rounded-md text-sm w-40 lg:w-64 focus:ring-2 focus:ring-ring focus:outline-none border border-transparent focus:border-border"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={onClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
                onClick={onVisionClick}
                aria-label="Use AI Vision to identify products"
                className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
                <CameraIcon className="h-6 w-6" />
            </button>
            <button 
                onClick={onCartClick}
                aria-label={`View shopping cart with ${cartItemCount} items`}
                className="relative p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                <ShoppingCartIcon className="h-6 w-6" />
                {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                        {cartItemCount}
                    </span>
                )}
            </button>
            
            {currentUser ? (
               <div className="relative group hidden md:block">
                <button className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                  <UserIcon className="h-6 w-6" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 ring-1 ring-border">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground truncate">Signed in as</p>
                    <p className="text-sm text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                  <div className="border-t border-border"></div>
                  <a href="#" onClick={(e) => { e.preventDefault(); onProfileClick(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                    <UserIcon className="h-4 w-4 mr-2" />
                    My Profile
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onWishlistClick(); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                    <HeartIcon className="h-4 w-4 mr-2" />
                    My Wishlist
                  </a>
                  <a href="#" onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Logout
                  </a>
                </div>
              </div>
            ) : (
              <button onClick={onLoginClick} className="hidden md:inline-block px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Login
              </button>
            )}
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XIcon className="block h-6 w-6" />
                ) : (
                  <MenuIcon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); setIsMobileMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); setIsMobileMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">Categories</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onHomeClick(); setIsMobileMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">Products</a>
             {currentUser ? (
              <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center px-3">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="ml-3">
                      <div className="text-base font-medium text-foreground">Signed In</div>
                      <div className="text-sm font-medium text-muted-foreground">{currentUser.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                     <a href="#" onClick={(e) => { e.preventDefault(); onProfileClick(); setIsMobileMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                      <UserIcon className="h-5 w-5 mr-2" />
                      My Profile
                    </a>
                     <a href="#" onClick={(e) => { e.preventDefault(); onWishlistClick(); setIsMobileMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                      <HeartIcon className="h-5 w-5 mr-2" />
                      My Wishlist
                    </a>
                     <a href="#" onClick={handleLogout} className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                      <LogOutIcon className="h-5 w-5 mr-2" />
                      Logout
                    </a>
                  </div>
              </div>
             ) : (
                <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="w-full mt-2 text-left block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                  Login
                </button>
             )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;