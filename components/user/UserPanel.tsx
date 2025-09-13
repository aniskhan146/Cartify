import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header'; // Import the new Header
import Dock from './Dock';
import BorderBeam from './BorderBeam';
import ThreeDImageRing from './ThreeDImageRing';
import CategoryProductSection from './CategoryProductSection';
import Footer from './Footer';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './CheckoutPage';
import VisionPage from './VisionPage';
import WishlistPage from './WishlistPage';
import ProfilePage from './ProfilePage';
import SearchModal from './SearchModal';
import AllProductsPage from './AllProductsPage';
import QuickViewModal from './QuickViewModal';
import TrackOrderPage from './TrackOrderPage';
import OrderConfirmationPage from './OrderConfirmationPage';
import RecentlyViewedSection from './RecentlyViewedSection';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import type { Product, Category } from '../../types';
import { 
    HeartIcon, HomeIcon, CameraIcon, ShoppingCartIcon, UserIcon, SearchIcon, ChevronUpIcon
} from '../shared/icons';
import { onProductsValueChange, onCategoriesValueChange, onHeroImagesChange } from '../../services/databaseService';
import ShinyText from '../shared/ShinyText';

interface UserPanelProps {
  onSwitchToAdminLogin: () => void;
  onLoginClick: () => void;
}

type ViewState =
  | { name: 'shop' }
  | { name: 'productDetail'; payload: Product }
  | { name: 'checkout' }
  | { name: 'vision' }
  | { name: 'wishlist' }
  | { name: 'profile' }
  | { name: 'trackOrder' }
  | { name: 'orderConfirmation'; payload: { orderId: string } }
  | { name: 'allProducts'; payload?: { initialCategory?: string } };

const UserPanel: React.FC<UserPanelProps> = ({ onSwitchToAdminLogin, onLoginClick }) => {
  const { currentUser } = useAuth();
  const { clearCart, cartItemCount } = useCart();
  const { wishlistItems } = useWishlist();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState<ViewState>({ name: 'shop' });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);

  useEffect(() => {
    const unsubscribeProducts = onProductsValueChange((products) => {
      setAllProducts(products);
    });
    
    const unsubscribeCategories = onCategoriesValueChange((dbCategories) => {
        const mappedCategories: Category[] = dbCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            iconUrl: cat.iconUrl,
        }));
        setCategories(mappedCategories);
    });

    const unsubscribeHeroImages = onHeroImagesChange((images) => {
        setHeroImages(images || []); // Ensure heroImages is always an array
    });

    const timer = setTimeout(() => setIsLoading(false), 1200);

    return () => {
        unsubscribeProducts();
        unsubscribeCategories();
        unsubscribeHeroImages();
        clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsScrollButtonVisible(true);
        } else {
            setIsScrollButtonVisible(false);
        }
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
  };

  const finalHeroImages = useMemo(() => {
    // Per user request, only display images from Storefront Settings.
    // If no images are set by the admin, the ring will be empty.
    return heroImages;
  }, [heroImages]);

  const handleAdminAccessClick = () => {
    onSwitchToAdminLogin();
  };
  
  const handleGoHome = () => {
    setView({ name: 'shop' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (orderId: string) => {
    clearCart();
    setView({ name: 'orderConfirmation', payload: { orderId } });
  };
  
  const handleProductClick = (product: Product) => {
    setQuickViewProduct(product);
  };
  
  const handleProductClickFromSearch = (product: Product) => {
    setQuickViewProduct(product);
    setIsSearchModalOpen(false);
  };
  
  const handleCategoryClick = (categoryId: string) => {
    setView({ name: 'allProducts', payload: { initialCategory: categoryId } });
  };

  const handleViewAllClick = (initialCategory?: string) => {
    setView({ name: 'allProducts', payload: { initialCategory } });
  };

  const handleTrackOrderClick = () => {
    setView({ name: 'trackOrder' });
  };


  const dockItems = [
    { icon: <HomeIcon className="h-6 w-6 text-foreground" />, label: 'Home', onClick: handleGoHome },
    { icon: <SearchIcon className="h-6 w-6 text-foreground" />, label: 'Search', onClick: () => setIsSearchModalOpen(true) },
    { icon: <CameraIcon className="h-6 w-6 text-foreground" />, label: 'AI Vision', onClick: () => setView({ name: 'vision' }) },
    { icon: <ShoppingCartIcon className="h-6 w-6 text-foreground" />, label: 'Cart', onClick: () => setView({ name: 'checkout' }), badgeCount: cartItemCount },
  ];

  if (currentUser) {
    dockItems.splice(3, 0, { // insert wishlist after vision
        icon: <HeartIcon className="h-6 w-6 text-foreground" />,
        label: 'Wishlist',
        onClick: () => setView({ name: 'wishlist' }),
        badgeCount: wishlistItems.length,
    });
    dockItems.push({
        icon: <UserIcon className="h-6 w-6 text-foreground" />,
        label: 'Profile',
        onClick: () => setView({ name: 'profile' }),
    });
  } else {
    dockItems.push({
        icon: <UserIcon className="h-6 w-6 text-foreground" />,
        label: 'Login',
        onClick: onLoginClick,
    });
  }
  
  const renderContent = () => {
    switch (view.name) {
      case 'productDetail':
        return <ProductDetailPage product={view.payload} onBack={() => setView({ name: 'shop' })} onNavigateToCheckout={() => setView({ name: 'checkout' })} />;
      case 'checkout':
        return <CheckoutPage onBackToShop={() => setView({ name: 'shop' })} onOrderPlaced={handleOrderPlaced} onLoginClick={onLoginClick} />;
      case 'vision':
        return <VisionPage onBackToShop={() => setView({ name: 'shop' })} />;
      case 'wishlist':
        return <WishlistPage onBackToShop={() => setView({ name: 'shop' })} onProductClick={handleProductClick} />;
      case 'profile':
        return <ProfilePage onBackToShop={() => setView({ name: 'shop' })} />;
      case 'trackOrder':
        return <TrackOrderPage onBackToShop={() => setView({ name: 'shop' })} />;
       case 'orderConfirmation':
        return <OrderConfirmationPage orderId={view.payload.orderId} onContinueShopping={() => setView({ name: 'shop' })} onTrackOrder={() => setView({ name: 'trackOrder' })} />;
      case 'allProducts':
        return (
            <AllProductsPage
                allProducts={allProducts}
                categories={categories}
                onProductClick={handleProductClick}
                onBack={() => setView({ name: 'shop' })}
                initialCategory={view.payload?.initialCategory}
            />
        );
      case 'shop':
      default:
        return (
          <>
            <div id="hero" className="pt-20">
              <div className="w-full min-h-[450px] bg-background flex flex-col items-center justify-center p-4 gap-8">
                <div className="relative group max-w-7xl w-full h-[350px] bg-black rounded-xl shadow-lg border border-gray-800 overflow-hidden flex justify-center items-center">
                  <ThreeDImageRing images={finalHeroImages} width={600} imageDistance={450} />
                  <BorderBeam size={300} duration={8} delay={9} />
                </div>
                <ShinyText size="xl" weight="semibold" className="text-center px-4">
                  Always Yours Express – Quick, easy, and just for you!
                </ShinyText>
              </div>
            </div>
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
              {categories.map((category) => {
                const categoryProducts = allProducts.filter(
                  (p) => p.category === category.name
                );
                if (categoryProducts.length > 0) {
                  return (
                    <CategoryProductSection
                      key={category.id}
                      category={category}
                      products={categoryProducts}
                      onProductClick={handleProductClick}
                      onViewAllClick={() => handleViewAllClick(category.name)}
                    />
                  );
                }
                return null;
              })}
            </div>
          </>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const showHeaderAndAdminButton = view.name === 'shop';
  
  // FIX: Refactored animation props to use variants for compatibility with newer framer-motion versions.
  const scrollButtonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showHeaderAndAdminButton && <Header 
        onHomeClick={handleGoHome}
        onSearchClick={() => setIsSearchModalOpen(true)} 
        onLoginClick={onLoginClick} 
        categories={categories} 
        onCategoryClick={(id) => handleCategoryClick(categories.find(c=>c.id === id)?.name ?? '')} 
        onViewAllProductsClick={() => handleViewAllClick()} 
      />}
      
      <main className="flex-grow">
        {renderContent()}
      </main>
      
      {view.name === 'shop' && <RecentlyViewedSection allProducts={allProducts} onProductClick={handleProductClick} />}

      {showHeaderAndAdminButton && (
        <div className="w-full flex justify-center py-12 bg-background">
          <button
            onClick={handleAdminAccessClick}
            className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
            aria-label="Access the admin panel"
          >
            Access Admin Panel
          </button>
        </div>
      )}
      
      <Footer onTrackOrderClick={handleTrackOrderClick} onViewAllProductsClick={() => handleViewAllClick()} />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <Dock items={dockItems} />
      </div>

       <AnimatePresence>
            {isScrollButtonVisible && (
                <motion.button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-5 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    aria-label="Scroll to top"
                    variants={scrollButtonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <ChevronUpIcon className="h-6 w-6" />
                </motion.button>
            )}
        </AnimatePresence>

      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        allProducts={allProducts}
        onProductClick={handleProductClickFromSearch}
      />

      {quickViewProduct && (
        <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onNavigateToCheckout={() => {
                setQuickViewProduct(null); // Close modal
                setView({ name: 'checkout' }); // Navigate
            }}
        />
      )}

    </div>
  );
};

export default UserPanel;