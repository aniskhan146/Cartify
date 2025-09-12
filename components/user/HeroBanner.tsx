
import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div className="relative bg-secondary">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover"
          src="https://picsum.photos/1600/600"
          alt="Hero Banner"
        />
        <div className="absolute inset-0 bg-background/30"></div>
      </div>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-48 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground tracking-tight" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
          Summer Collection is Here
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-primary-foreground/90" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
          Discover the latest trends and refresh your style. Unbeatable prices, unforgettable quality.
        </p>
        <div className="mt-10">
          <a
            href="#"
            className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 shadow-lg"
          >
            Shop Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;