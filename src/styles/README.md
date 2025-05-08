# BA Portal Design System

This document outlines the modern design system used throughout the BA Portal application. The system follows a dark blue, minimalist, and futuristic SaaS aesthetic.

## Color Palette

- Primary: Blue/Purple (#4a5ee4) - Used for primary actions, highlights, and important UI elements
- Secondary: Teal (#14b8a6) - Used for secondary actions and alternative highlights
- Dark Blue: (#082f49) - Used for deep backgrounds and accents
- Background: Dark gray (#0d131f) - Main application background
- Card Background: Darker gray (#1f2937) - Surface elements and cards
- Text: Light gray (#f3f4f6) - Primary text color

## Typography

- **Headings**: Bold, slightly larger, with tight tracking for a modern look
- **Body**: Clean, legible text with proper contrast against backgrounds
- **Accents**: Glow effects for important text to create depth

## UI Components

### Interactive Elements

#### Buttons
- `.btn-primary`: Blue background with subtle glow effect
- `.btn-secondary`: Teal background for secondary actions
- `.btn-outline`: Transparent with border for less prominent actions
- `.btn-ghost`: Text-only button for minimal visual impact

#### Form Elements
- Larger padding (p-3)
- Dark backgrounds with light text
- Focus states with glowing ring effect
- Smooth transitions between states

### Layout Elements

#### Cards
- `.card`: Dark surface elements with slight elevation
- `.glass-card`: Translucent backdrop blur effect for a modern look
- Subtle hover effects to improve interactivity
- Rounded corners (rounded-xl) for a softer appearance

#### Page Structure
- `.page-header`: Clean section for page titles and actions
- `.section`: Content grouping with proper spacing
- `.accent-border`: Left border accent for important sections

### Status Indicators

- `.status-badge`: Pills for showing status (active, pending, etc.)
- `.glow-text`: Text with subtle glow effect for highlighting
- `.glow-border`: Borders with subtle glow effect

## New Components

### Navigation
- `.nav-item`: Navigation links with hover states
- `.nav-item.active`: Active navigation indicator

### Dashboard Elements
- `.stat-card`: Cards for displaying statistics
- `.chart-container`: Container for data visualization

### Data Display
- `.admin-table`: Enhanced table styling with hover states
- `.pagination`: Controls for paginated data

## Example Usage

```jsx
<div className="px-2">
  <div className="page-header">
    <div>
      <h1 className="glow-text">Dashboard</h1>
      <p className="subtitle">Overview of your account</p>
    </div>
    <div>
      <Button 
        variant="primary" 
        rightIcon={<PlusIcon />}
      >
        Add New
      </Button>
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div className="stat-card">
      <p className="stat-label">Total Clients</p>
      <p className="stat-value">256</p>
      <p className="stat-change positive">+12% from last month</p>
    </div>
    {/* More stat cards */}
  </div>
  
  <div className="card">
    <div className="accent-border mb-6">
      <h2>Recent Activity</h2>
      <p className="subtitle">Your latest interactions</p>
    </div>
    
    <table className="admin-table">
      {/* Table content */}
    </table>
  </div>
</div>
```

## Animation and Effects

- Subtle transitions for state changes (200ms duration)
- Hover effects for interactive elements
- Pulse animations for loading states
- Glow effects for emphasis 