import React, { useState } from 'react';
import { LogoIcon, FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon } from '../shared/icons';
import { useNotification } from '../../contexts/NotificationContext';
import { subscribeToNewsletter } from '../../services/databaseService';

interface FooterProps {
  onTrackOrderClick: () => void;
  // A bit of a hack to get "All Products" page to show, but better than non-functional links.
  onViewAllProductsClick: () => void; 
}

const Footer: React.FC<FooterProps> = ({ onTrackOrderClick, onViewAllProductsClick }) => {
  const { addNotification } = useNotification();
  const [email, setEmail] = useState('');

  const handleLinkClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };
  
  const handleComingSoonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addNotification('This feature is coming soon!', 'info');
  };
  
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
        addNotification('Please enter a valid email address.', 'error');
        return;
    }
    try {
        await subscribeToNewsletter(email);
        addNotification("Thank you for subscribing!", 'success');
        setEmail('');
    } catch (error) {
        addNotification('There was an error subscribing. Please try again.', 'error');
    }
  };
  
  return (
    <footer className="bg-card text-secondary-foreground border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          
          {/* Brand and Social Section */}
          <div className="lg:col-span-2">
             <a href="#" className="flex items-center gap-2 mb-4">
                <LogoIcon className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl text-foreground">AYExpress</span>
            </a>
            <p className="mt-4 text-muted-foreground max-w-sm">
              Your one-stop shop for everything you need. Quality products, amazing prices, delivered to your door.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                <FacebookIcon className="h-6 w-6" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                <TwitterIcon className="h-6 w-6" />
              </a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                <LinkedinIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Shop</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" onClick={(e) => handleLinkClick(e, onViewAllProductsClick)} className="text-muted-foreground hover:text-primary transition-colors">Categories</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, onViewAllProductsClick)} className="text-muted-foreground hover:text-primary transition-colors">New Arrivals</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, onViewAllProductsClick)} className="text-muted-foreground hover:text-primary transition-colors">Best Sellers</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, onViewAllProductsClick)} className="text-muted-foreground hover:text-primary transition-colors">All Products</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">Support</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" onClick={handleComingSoonClick} className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" onClick={handleComingSoonClick} className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" onClick={handleComingSoonClick} className="text-muted-foreground hover:text-primary transition-colors">Shipping & Returns</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, onTrackOrderClick)} className="text-muted-foreground hover:text-primary transition-colors">Track Order</a></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Stay Connected</h3>
            <p className="mt-4 text-muted-foreground">Subscribe to our newsletter for the latest updates.</p>
            <form className="mt-4 flex" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-2 rounded-l-md text-foreground bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                aria-label="Email for newsletter"
              />
              <button 
                type="submit"
                className="bg-primary text-primary-foreground px-4 rounded-r-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                aria-label="Subscribe to newsletter"
              >
                Go
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground space-y-4 md:space-y-0">
          <p>&copy; {new Date().getFullYear()} AYExpress. All rights reserved.</p>
          <div className="flex space-x-6">
             <a href="#" onClick={handleComingSoonClick} className="hover:text-primary transition-colors">Terms of Service</a>
             <a href="#" onClick={handleComingSoonClick} className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;