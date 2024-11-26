import React from 'react'
import styled from 'styled-components'
import { useGlobeStore } from '../stores/globeStore'
import BrandTitle from './BrandTitle'

const ContentOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  
  h2 {
    color: #fff;
    font-size: 2rem;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px #ff00ff;
  }
  
  p {
    color: #fff;
    font-size: 1.2rem;
  }
`

const Interface: React.FC = () => {
  const { highlightedRegion } = useGlobeStore()

  return (
    <>
      <BrandTitle />
      <ContentOverlay $visible={!!highlightedRegion}>
        <h2>{highlightedRegion}</h2>
        <p>Content for {highlightedRegion}</p>
      </ContentOverlay>
    </>
  )
}

export default Interface 