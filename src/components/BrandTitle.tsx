import React, { useEffect, useRef } from 'react'
import styled, { keyframes, css } from 'styled-components'

// Lightning flash animation with random angles
const createLightningFlash = (angle: number) => keyframes`
  0%, 100% {
    opacity: 0;
    transform: rotate(${angle}deg);
  }
  92% {
    opacity: 0;
    transform: rotate(${angle}deg);
  }
  93% {
    opacity: 0.6;
    transform: rotate(${angle + 5}deg);
  }
  94% {
    opacity: 0.2;
    transform: rotate(${angle - 3}deg);
  }
  96% {
    opacity: 0.9;
    transform: rotate(${angle + 2}deg);
  }
  98% {
    opacity: 0.4;
    transform: rotate(${angle}deg);
  }
`

const float = keyframes`
  0%, 100% {
    transform: translateY(0) perspective(500px) rotateX(20deg);
  }
  50% {
    transform: translateY(-10px) perspective(500px) rotateX(20deg);
  }
`

const swing = keyframes`
  0% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
  100% { transform: rotate(-5deg); }
`

const TitleContainer = styled.div`
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  
  h1 {
    font-size: 4rem;
    font-weight: 900;
    letter-spacing: 0.5rem;
    animation: ${float} 3s ease-in-out infinite;
    position: relative;
    
    background: linear-gradient(
      45deg, 
      #ff00ff 0%,
      #b300b3 25%,
      #ff00ff 50%,
      #b300b3 75%,
      #ff00ff 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-stroke: 2px rgba(255, 0, 255, 0.8);
    -webkit-text-stroke: 2px rgba(255, 0, 255, 0.8);
    filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.5));
  }
`

const Letter = styled.span<{ $isHanging?: boolean }>`
  display: inline-block;
  position: relative;
  
  ${props => props.$isHanging && css`
    animation: ${swing} 4s ease-in-out infinite;
    transform-origin: top;
    position: relative;
    top: 10px;
  `}
`

// Create multiple lightning bolts with different positions and angles
const createLightningBolt = (index: number) => styled.div`
  position: absolute;
  width: 3px;
  height: ${20 + Math.random() * 30}px;
  background: #ff00ff;
  animation: ${createLightningFlash(Math.random() * 360)} ${5 + Math.random() * 4}s infinite;
  animation-delay: ${Math.random() * -5}s;
  box-shadow: 
    0 0 10px #ff00ff,
    0 0 20px #ff00ff,
    0 0 30px #ff00ff;
  clip-path: polygon(
    50% 0%, 
    100% 50%, 
    75% 50%, 
    100% 100%, 
    0% 50%, 
    25% 50%
  );
  left: ${Math.random() * 100}%;
  top: ${Math.random() * 100}%;
  opacity: 0;
`

const BrandTitle = () => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const letters = 'MADWRLD'.split('')
  const hangingLetterIndex = 4 // The 'R' will hang

  // Create 10 lightning bolt components
  const LightningBolts = Array.from({ length: 10 }, (_, i) => createLightningBolt(i))

  useEffect(() => {
    const addRandomLightning = () => {
      if (titleRef.current) {
        const letterElements = Array.from(titleRef.current.children)
        const numFlashes = Math.floor(Math.random() * 3) + 1 // Random number of letters to flash
        
        for (let i = 0; i < numFlashes; i++) {
          const letter = letterElements[
            Math.floor(Math.random() * letterElements.length)
          ] as HTMLSpanElement
          
          if (letter) {
            letter.style.textShadow = `
              0 0 10px #ff00ff,
              0 0 20px #ff00ff,
              0 0 30px #ff00ff,
              0 0 40px #ff00ff,
              0 0 70px #ff00ff
            `
            
            setTimeout(() => {
              if (letter) {
                letter.style.textShadow = ''
              }
            }, 100 + Math.random() * 200)
          }
        }
      }
    }

    const interval = setInterval(addRandomLightning, 1000 + Math.random() * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TitleContainer>
      <h1 ref={titleRef}>
        {letters.map((letter, i) => (
          <Letter key={i} $isHanging={i === hangingLetterIndex}>
            {letter}
          </Letter>
        ))}
      </h1>
      {LightningBolts.map((Bolt, i) => <Bolt key={i} />)}
    </TitleContainer>
  )
}

export default BrandTitle