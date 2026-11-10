import { useEffect, useRef, useState } from "react";

interface ScrollRevealTextProps {
  text: string;
  className?: string;
}

const ScrollRevealText = ({ text, className = "" }: ScrollRevealTextProps) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);
  const words = text.split(" ");

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress based on element position
      // Start revealing when element enters viewport, complete when it's 40% up
      const startPoint = windowHeight * 0.9;
      const endPoint = windowHeight * 0.3;
      
      if (rect.top >= startPoint) {
        setProgress(0);
      } else if (rect.top <= endPoint) {
        setProgress(1);
      } else {
        const scrollProgress = (startPoint - rect.top) / (startPoint - endPoint);
        setProgress(Math.min(Math.max(scrollProgress, 0), 1));
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getWordOpacity = (index: number): number => {
    const wordProgress = index / words.length;
    const revealThreshold = progress * 1.5; // Multiplier to create staggered effect
    
    if (wordProgress < revealThreshold - 0.3) {
      return 1;
    } else if (wordProgress < revealThreshold) {
      return 0.3 + ((revealThreshold - wordProgress) / 0.3) * 0.7;
    }
    return 0.3;
  };

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="transition-opacity duration-300"
          style={{ opacity: getWordOpacity(index) }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
};

export default ScrollRevealText;