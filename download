@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-serif: "Cormorant Garamond", serif;
  --font-sans: "Inter", sans-serif;
  
  --color-gold-50: #fbfaf7;
  --color-gold-100: #f4f1e8;
  --color-gold-200: #e7e0cc;
  --color-gold-300: #d5c8a5;
  --color-gold-400: #c1ab7b;
  --color-gold-500: #b1955d;
  --color-gold-600: #a1814b;
  --color-gold-700: #866a41;
  --color-gold-800: #6f5839;
  --color-gold-900: #5c4a32;
  --color-gold-950: #33281a;
}

@layer base {
  body {
    @apply font-sans text-gray-900 bg-white antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif;
  }
}

.glass {
  @apply bg-white/70 backdrop-blur-md border border-white/20;
}

.gold-gradient {
  background: linear-gradient(135deg, #b1955d 0%, #d5c8a5 50%, #b1955d 100%);
}

@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

