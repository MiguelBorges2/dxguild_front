<template>
  <div class="adventurers-container">
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <!-- Fundo decorativo -->
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#8b7500;stop-opacity:0.1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Círculo de fundo -->
      <circle cx="200" cy="200" r="180" fill="url(#goldGradient)" stroke="#d4af37" stroke-width="2"/>

      <!-- Adventureiro 1: Guerreiro com espada (centro esquerda) -->
      <g class="adventurer warrior">
        <ellipse cx="120" cy="150" rx="25" ry="30" fill="#8b4513" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Capacete -->
        <path d="M 100 130 Q 120 110 140 130" fill="#696969" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Corpo -->
        <rect x="105" y="180" width="30" height="35" fill="#a0522d" stroke="#d4af37" stroke-width="1"/>
        <!-- Armadura -->
        <path d="M 105 180 L 135 180 L 135 210 L 105 210 Z" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.6"/>
        <!-- Pernas -->
        <line x1="110" y1="215" x2="110" y2="250" stroke="#696969" stroke-width="3"/>
        <line x1="130" y1="215" x2="130" y2="250" stroke="#696969" stroke-width="3"/>
        <!-- Espada -->
        <line x1="145" y1="185" x2="175" y2="150" stroke="#c0c0c0" stroke-width="2"/>
        <polygon points="175,145 180,150 170,155" fill="#d4af37"/>
      </g>

      <!-- Adventureiro 2: Mago (centro) -->
      <g class="adventurer mage">
        <ellipse cx="200" cy="140" rx="28" ry="32" fill="#4b0082" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Chapéu de mago -->
        <polygon points="200,105 185,125 215,125" fill="#4b0082" stroke="#d4af37" stroke-width="1.5"/>
        <circle cx="200" cy="108" r="4" fill="#ffd700"/>
        <!-- Corpo -->
        <rect x="182" y="172" width="36" height="38" fill="#5c5c8a" stroke="#d4af37" stroke-width="1"/>
        <!-- Manto -->
        <path d="M 182 172 Q 170 190 175 220" fill="#4b0082" stroke="#d4af37" stroke-width="1.5" opacity="0.7"/>
        <path d="M 218 172 Q 230 190 225 220" fill="#4b0082" stroke="#d4af37" stroke-width="1.5" opacity="0.7"/>
        <!-- Pernas -->
        <line x1="190" y1="210" x2="190" y2="250" stroke="#696969" stroke-width="3"/>
        <line x1="210" y1="210" x2="210" y2="250" stroke="#696969" stroke-width="3"/>
        <!-- Bastão mágico -->
        <line x1="220" y1="160" x2="240" y2="120" stroke="#d4af37" stroke-width="2"/>
        <circle cx="240" cy="115" r="5" fill="#ffd700" filter="url(#glow)"/>
        <polygon points="240,110 245,120 235,120" fill="#d4af37"/>
      </g>

      <!-- Adventureiro 3: Arqueira (centro direita) -->
      <g class="adventurer archer">
        <ellipse cx="280" cy="155" rx="24" ry="28" fill="#8b4513" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Capuz -->
        <path d="M 265 135 Q 280 120 295 135" fill="#654321" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Corpo -->
        <rect x="268" y="183" width="24" height="32" fill="#a0522d" stroke="#d4af37" stroke-width="1"/>
        <!-- Pernas -->
        <line x1="273" y1="215" x2="273" y2="250" stroke="#696969" stroke-width="3"/>
        <line x1="289" y1="215" x2="289" y2="250" stroke="#696969" stroke-width="3"/>
        <!-- Arco -->
        <path d="M 300 170 Q 315 155 310 140" fill="none" stroke="#8b4513" stroke-width="2.5"/>
        <line x1="310" y1="140" x2="305" y2="165" stroke="#d4af37" stroke-width="1"/>
        <!-- Flecha -->
        <line x1="305" y1="165" x2="315" y2="150" stroke="#d4af37" stroke-width="1.5"/>
        <polygon points="315,145 318,150 310,152" fill="#d4af37"/>
      </g>

      <!-- Adventureiro 4: Clérigo (atrás, um pouco maior) -->
      <g class="adventurer cleric" opacity="0.85">
        <ellipse cx="340" cy="200" rx="22" ry="26" fill="#8b0000" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Capuz religioso -->
        <path d="M 328 180 Q 340 165 352 180" fill="#8b0000" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Cruz no peito -->
        <line x1="340" y1="195" x2="340" y2="220" stroke="#d4af37" stroke-width="1.5"/>
        <line x1="333" y1="205" x2="347" y2="205" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Corpo -->
        <rect x="329" y="208" width="22" height="30" fill="#a52a2a" stroke="#d4af37" stroke-width="1"/>
        <!-- Pernas -->
        <line x1="334" y1="238" x2="334" y2="270" stroke="#696969" stroke-width="3"/>
        <line x1="346" y1="238" x2="346" y2="270" stroke="#696969" stroke-width="3"/>
        <!-- Escudo -->
        <circle cx="315" cy="210" r="12" fill="#c0c0c0" stroke="#d4af37" stroke-width="1.5"/>
        <line x1="315" y1="200" x2="315" y2="220" stroke="#d4af37" stroke-width="1"/>
      </g>

      <!-- Efeito de magia ao redor -->
      <circle cx="200" cy="200" r="190" fill="none" stroke="#d4af37" stroke-width="1" stroke-dasharray="5,5" opacity="0.5"/>
      
      <!-- Estrelas decorativas -->
      <g fill="#ffd700" opacity="0.6">
        <polygon points="80,80 85,90 95,90 87,97 90,107 80,100 70,107 73,97 65,90 75,90"/>
        <polygon points="320,90 323,98 331,98 325,103 328,111 320,106 312,111 315,103 309,98 317,98"/>
        <polygon points="90,300 93,308 101,308 95,313 98,321 90,316 82,321 85,313 79,308 87,308"/>
        <polygon points="310,310 313,317 321,317 315,322 318,330 310,325 302,330 305,322 299,317 307,317"/>
      </g>
    </svg>
  </div>
</template>

<script setup>
</script>

<style scoped>
.adventurers-container {
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
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.4));
  animation: rotateSlowly 20s linear infinite;
}

@keyframes rotateSlowly {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.adventurer {
  animation: shimmer 3s ease-in-out infinite;
}

.warrior {
  animation-delay: 0s;
}

.mage {
  animation-delay: 0.5s;
}

.archer {
  animation-delay: 1s;
}

.cleric {
  animation-delay: 1.5s;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.3));
  }
  50% {
    opacity: 0.85;
    filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.6));
  }
}

@media (max-width: 768px) {
  svg {
    max-width: 350px;
  }
}
</style>
