

import React from 'react';
import BorderBeam from './BorderBeam';

const PromoSection: React.FC = () => {
  return (
    <section id="promo-section" className="bg-secondary py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2">
              <img src="https://picsum.photos/800/600?grayscale" alt="Promo" className="object-cover h-full w-full" />
            </div>
            <div className="w-full md:w-1/2 p-8 lg:p-12 text-center md:text-left">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">Exclusive Member Deals</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Sign up today and get 20% off your first order. Plus, get access to members-only products and special promotions.
              </p>
              <div className="mt-6">
                <a
                  href="#"
                  className="inline-block bg-primary text-primary-foreground font-bold py-3 px-6 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
          <BorderBeam size={400} duration={8} />
        </div>
      </div>
    </section>
  );
};

export default PromoSection;