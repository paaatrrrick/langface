import React, { useEffect, useRef, useState } from "react";
import './Animation.css';

const AnimatedWrapper = ({ children, direction = "left", style, className }) => {
  const ref = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isAnimated) {
          setIsVisible(true);
          setIsAnimated(true);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isAnimated]);

  return (
    <div
      style={style}
      ref={ref} 
      className={`${isVisible ? `animate-${direction}` : ""} ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedWrapper;
