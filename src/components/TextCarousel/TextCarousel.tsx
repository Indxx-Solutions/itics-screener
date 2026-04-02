import React, { useState, useEffect } from "react";
import "./../textCarousel.scss";
import secureShield from "./../secureShield.png";

interface TextCarouselProps {
  items: string[];
  delay?: number;
}

const TextCarousel: React.FC<TextCarouselProps> = ({
  items = [],
  delay = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false); // Reset animation
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        setAnimate(true); // Trigger animation
      }, 50); // Small delay to allow class reset
    }, delay);

    return () => clearInterval(interval);
  }, [items.length, delay]);

  if (items.length === 0) return null;

  return (
    <div className="carousel-container">
      <div className="carousel">
        <div className="carousel-icon">
          <img src={secureShield} alt="" height={60} width={60} />
        </div>
        <div className={`carousel-text ${animate ? "animate" : ""}`}>
          {items[currentIndex]}
        </div>
      </div>
    </div>
  );
};

export default TextCarousel;