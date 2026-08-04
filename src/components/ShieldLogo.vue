<template>
  <div class="shield-container">
    <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#f0e68c;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#8b7500;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="swordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e8e8e8;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b0b0b0;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="5" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Shield -->
      <g class="shield" filter="url(#shadow)">
        <!-- Main shield shape -->
        <path d="M 200 50 L 320 130 L 320 280 Q 320 380 200 450 Q 80 380 80 280 L 80 130 Z" 
              fill="url(#shieldGradient)" 
              stroke="#8b7500" 
              stroke-width="3"/>
        
        <!-- Shield inner border -->
        <path d="M 200 60 L 310 130 L 310 280 Q 310 375 200 440 Q 90 375 90 280 L 90 130 Z" 
              fill="none" 
              stroke="#f0e68c" 
              stroke-width="2" 
              opacity="0.6"/>

        <!-- Shield pattern - cross -->
        <line x1="200" y1="100" x2="200" y2="380" stroke="#8b7500" stroke-width="1.5" opacity="0.3"/>
        <line x1="130" y1="200" x2="270" y2="200" stroke="#8b7500" stroke-width="1.5" opacity="0.3"/>

        <!-- Decorative corners -->
        <circle cx="100" cy="140" r="6" fill="#8b7500" opacity="0.5"/>
        <circle cx="300" cy="140" r="6" fill="#8b7500" opacity="0.5"/>
      </g>

      <!-- Left Sword (going through shield from left) -->
      <g class="sword-left" filter="url(#shadow)">
        <!-- Blade -->
        <polygon points="80,180 280,220 280,240 80,200" 
                 fill="url(#swordGradient)" 
                 stroke="#8b8b8b" 
                 stroke-width="1.5"
                 opacity="0.95"/>
        
        <!-- Blade highlight -->
        <line x1="80" y1="185" x2="280" y2="225" stroke="#ffffff" stroke-width="1" opacity="0.4"/>
        
        <!-- Cross-guard -->
        <rect x="70" y="170" width="20" height="60" fill="#d4af37" stroke="#8b7500" stroke-width="1.5"/>
        
        <!-- Handle -->
        <rect x="35" y="190" width="35" height="20" rx="3" fill="#8b4513" stroke="#d4af37" stroke-width="1"/>
        
        <!-- Pommel -->
        <circle cx="25" cy="200" r="8" fill="#d4af37" stroke="#8b7500" stroke-width="1.5"/>
      </g>

      <!-- Right Sword (going through shield from right) -->
      <g class="sword-right" filter="url(#shadow)">
        <!-- Blade -->
        <polygon points="320,180 120,220 120,240 320,200" 
                 fill="url(#swordGradient)" 
                 stroke="#8b8b8b" 
                 stroke-width="1.5"
                 opacity="0.95"/>
        
        <!-- Blade highlight -->
        <line x1="320" y1="185" x2="120" y2="225" stroke="#ffffff" stroke-width="1" opacity="0.4"/>
        
        <!-- Cross-guard -->
        <rect x="310" y="170" width="20" height="60" fill="#d4af37" stroke="#8b7500" stroke-width="1.5"/>
        
        <!-- Handle -->
        <rect x="330" y="190" width="35" height="20" rx="3" fill="#8b4513" stroke="#d4af37" stroke-width="1"/>
        
        <!-- Pommel -->
        <circle cx="375" cy="200" r="8" fill="#d4af37" stroke="#8b7500" stroke-width="1.5"/>
      </g>

      <!-- Text: DXGuild -->
      <g class="text-group">
        <text x="200" y="240" 
              font-family="'Cinzel', serif" 
              font-size="48" 
              font-weight="900"
              text-anchor="middle"
              fill="#000"
              letter-spacing="2">DXGuild</text>
        
        <text x="200" y="240" 
              font-family="'Cinzel', serif" 
              font-size="48" 
              font-weight="900"
              text-anchor="middle"
              fill="url(#shieldGradient)"
              letter-spacing="2"
              opacity="0.8">DXGuild</text>
      </g>

      <!-- Glow effect around shield -->
      <circle cx="200" cy="230" r="160" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>
    </svg>
  </div>
</template>

<script setup>
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap');

.shield-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

svg {
  width: 100%;
  max-width: 500px;
  height: auto;
  filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.4));
}

.shield {
  animation: shieldPulse 3s ease-in-out infinite;
}

.sword-left {
  animation: swordSlideIn 2s ease-out, swordGlow 3s ease-in-out infinite;
}

.sword-right {
  animation: swordSlideInRight 2s ease-out, swordGlow 3s ease-in-out infinite;
  animation-delay: 0.5s;
}

.text-group {
  animation: textAppear 2.5s ease-out;
}

@keyframes shieldPulse {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.6));
  }
}

@keyframes swordSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes swordSlideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes swordGlow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(200, 200, 200, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.5));
  }
}

@keyframes textAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  svg {
    max-width: 350px;
  }
}
</style>
