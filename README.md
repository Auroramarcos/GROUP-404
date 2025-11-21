# Save Mars — 404 Interactive Experience

**Open the 404:** open `index.html` in this repository to load the interactive 404 page.

---

## 👨‍🚀 Team Members

- **Laura Altozano** 
- **Mariana González** 
- **Lucía Antón** 
- **Lucia Bilantuono** 
- **Aurora Marcos**
- **Sofía Castro** 

---

## 💡 Project Overview

**Asteroid Mission** is a **short, interactive 404 page** for a university project. Instead of a standard “Page Not Found,” users are presented with a **mini cinematic mission**:  
- Red, asteroid-like rocks fall toward **Mars**.  
- Users must **tap or click** to destroy the asteroids before they hit the Martian surface.  
- The experience is **cinematic, simple, and fun**, showing how a basic web page can become **interactive and engaging**.  

The project combines **HTML, CSS, and JavaScript** to create an interactive gaming experience on a traditionally static error page.

---

## 🎯 Objectives

1. Transform a **boring 404 page** into an **engaging interactive experience**.  
2. Explore **front-end animations** using CSS and JS.  
3. Create **responsive gameplay** compatible with both desktop and mobile.  
4. Practice **collaborative coding** in a university setting.  

---

## 🛠️ Project Process

### 1. Conceptualization

- Brainstormed ideas to turn a 404 page into something **interactive and cinematic**.  
- Settled on a **space theme**, with Mars under attack by falling asteroids.  
- Defined the **core gameplay**: clicking or tapping asteroids to destroy them before they hit the planet.

### 2. Design & Visual Changes

- **Asteroids:** Red, irregular shapes to mimic a cinematic meteor shower.  
- **Mars:** Added a simple surface at the bottom to show stakes for the player.  
- **Stars & Background:** Subtle twinkling stars and a gradient space background to give depth.  
- **Explosions:** Particle effect when an asteroid is destroyed to make the experience satisfying.  
- **Animation Smoothness:** Used **requestAnimationFrame** in JS to ensure smooth movement.  

### 3. Gameplay Logic

- Asteroids spawn at **random x positions** at the top of the screen.  
- Each asteroid **falls at a slightly different speed** to create variety.  
- Click/tap detection destroys asteroids and triggers the **explosion animation**.  
- Optional **score counter** shows how many asteroids the player has destroyed.  

### 4. Implementation Details

- **HTML:** Structured for semantic clarity (`<canvas>` for the game area, `<div>` for UI).  
- **CSS:**  
  - Gradient background for the space effect.  
  - Keyframe animations for explosions and twinkling stars.  
  - Responsive styling for different screen sizes.  
- **JavaScript:**  
  - Asteroid generation, movement, and destruction logic.  
  - Event listeners for mouse and touch input.  
  - Simple particle system for explosions.  
  - Loop optimization to ensure **smooth performance** on mobile and desktop.  

### 5. Testing & Iteration

- Tested on **Chrome, Firefox, and mobile devices**.  
- Adjusted asteroid sizes and speeds to **balance difficulty**.  
- Optimized animations to **prevent lag** on slower devices.  
- Added **visual feedback** for clicks to enhance user experience.  

### 6. Final Touches

- **Cinematic feel:** Added small particle effects for “cosmic dust.”  
- **Accessibility:** Large clickable areas for asteroids.  
- **Documentation:** Clear README explaining purpose, gameplay, and process.  

---

## 🕹️ How to Play

1. Open `index.html` in your browser.  
2. Watch red asteroids fall toward Mars.  
3. Click or tap each asteroid to destroy it.  
4. Survive as long as you can and enjoy the cinematic effects!  

---

## 🔧 Technologies Used

- **HTML5 & CSS3:** Page structure, styling, animations.  
- **JavaScript (Vanilla):** Asteroid spawning, movement, click detection, explosion effects.  
- **Responsive Design:** Mobile-friendly, touch-compatible gameplay.  

---

## ✨ Key Changes & Features

| Feature | Description |
|---------|-------------|
| Asteroids | Red, irregular shapes with random spawn and speed. |
| Explosion Effects | Particle bursts for satisfying feedback. |
| Animated Background | Gradient space with twinkling stars. |
| Mars Surface | Shows the planet is under threat. |
| Mobile Support | Click/tap detection works on smartphones and tablets. |
| Score Counter | Optional element to track performance. |
| Cinematic Feel | Smooth animations, particles, and cosmic aesthetics. |

---

## 📚 Lessons Learned

- Combining **gameplay logic with visual effects** can make even a 404 page engaging.  
- Proper **animation optimization** is crucial for smooth gameplay.  
- Collaboration allows each team member to focus on their strengths: visuals, logic, testing, and documentation.  
- Small interactive experiences can **teach coding, animation, and user experience principles**.  

---

> “Even when the page is lost, the mission continues.” – Asteroid Mission Team
