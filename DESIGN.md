# Shot Share - Design System

## Design Philosophy

Shot Share features a **dark, professional aesthetic** with **electric cyan accents** that creates a distinctive "tech-forward" identity perfect for a screenshot and image editing tool.

## Color Palette

### Primary Colors
- **Background**: `#0a0e14` - Deep slate for maximum focus
- **Foreground**: `#e6edf3` - Crisp white text
- **Primary (Accent)**: `#00d9ff` - Electric cyan for CTAs and highlights
- **Card**: `#161b22` - Elevated surfaces

### Secondary Colors
- **Secondary**: `#21262d` - Muted surfaces
- **Muted**: `#8b949e` - Subdued text
- **Border**: `rgba(255, 255, 255, 0.08)` - Subtle divisions
- **Destructive**: `#ff6b6b` - Error states

## Typography

### Font Families
- **Display/UI**: `Outfit` - Clean, modern sans-serif for headings and UI text
  - Weights: 300, 400, 500, 600, 700
- **Monospace**: `JetBrains Mono` - Code-like precision for paths, shortcuts, and technical data
  - Weights: 400, 500, 700

### Usage
- Headings use Outfit with weight 600-700
- Body text uses Outfit with weight 400
- Code, file paths, keyboard shortcuts, and settings inputs use JetBrains Mono

## Components

### Sidebar (224px width)
- **Compact design** with gradient overlay for depth
- **Logo** with lightning bolt icon + two-tone text (Shot + **Share**)
- **Navigation items** with hover states and active glow effect
- **Keyboard shortcut hint** at bottom with badge styling
- **Smooth animations** with staggered entrance

### Home Page
- **Hero section** with badge, large headline, and dual CTAs
- **Feature grid** with gradient backgrounds and hover scale effects
- **Quick start guide** with numbered steps
- **Keyboard shortcut showcase** with styled kbd elements

### Settings Pages (General & SFTP)
- **Section headers** with vertical accent bar
- **Card-based forms** with subtle shadows
- **Improved input fields** with mono font for technical data
- **Grid layouts** for better space utilization
- **Enhanced buttons** with glow effects on primary actions

### Image Editor
- **Floating toolbar** centered at bottom with backdrop blur
- **Grouped tool sections** separated by dividers
- **Icon-only tools** with tooltips showing shortcuts
- **Active tool highlighting** with glow animation
- **Integrated color picker** with hover effects
- **Context hints** appearing above toolbar when needed

## Animations

### Keyframes
- `glow` - Pulsing shadow effect for active elements (2s loop)
- `slideUp` - Subtle upward entrance (0.3s)
- `fadeIn` - Gentle opacity transition (0.2s)

### Usage
- **Page transitions**: fadeIn
- **Component entrance**: slideUp with staggered delays
- **Active states**: glow effect on primary buttons and active tools
- **Hover states**: scale transforms and color transitions

## Spacing & Layout

### Max Widths
- **Sidebar**: 224px (14rem)
- **Content**: 1280px (5xl)
- **Forms**: 768px (3xl)

### Border Radius
- **Default**: 0.5rem (8px)
- **Cards**: 0.75rem-1rem (12-16px)
- **Floating toolbar**: 1rem (16px)

### Shadows
- **Cards**: `shadow-lg` with subtle elevation
- **Floating toolbar**: `shadow-2xl` with dramatic depth
- **Active elements**: Colored shadows matching primary color

## Design Principles

1. **High Contrast**: Dark theme with bright accents ensures visibility and reduces eye strain
2. **Functional Beauty**: Every design choice serves the tool's purpose
3. **Compact Efficiency**: Information-dense without feeling cramped
4. **Smooth Interactions**: Micro-animations provide feedback without distraction
5. **Professional Polish**: Production-grade aesthetics that avoid generic "AI slop"

## Distinctive Elements

- **Two-tone branding** (Shot + Share in different colors)
- **Lightning bolt icon** suggesting speed and power
- **Floating editor toolbar** for modern, unobtrusive editing
- **Gradient feature cards** with subtle color coding
- **Monospace technical data** for precision feel
- **Glow effects** on active elements creating "powered on" aesthetic
- **Staggered animations** for organic, polished entrance effects

## Accessibility

- High contrast ratios for readability
- Keyboard shortcuts prominently displayed
- Focus states on interactive elements
- Disabled states clearly indicated with reduced opacity
- Semantic HTML structure maintained
