# Shot Share - Screenshot App

## Development

### Running the App
```bash
pnpm tauri dev
```

## TODO MVP List

- [X] Set up required Tauri plugins (global-shortcut, fs, system-tray)
- [X] Implement region selection overlay UI
- [X] Implement screenshot capture functionality (partial/region)
- [X] Create basic editor UI with canvas
- [X] Add rectangle/square drawing tool
- [X] Add text annotation tool
- [X] Implement settings storage (JSON file)
- [X] Create settings UI panel
- [X] Add SFTP upload functionality
- [X] Integrate system tray with menu
- [X] Add keyboard shortcut registration
- [ ] Test on Linux
- [ ] Test on Windows
- [ ] Test on macOS

## TODO Tickets

- [X] Settings - Shortcut error
- [X] Upload - Session error
- [X] Editor - Add arrow to image editor.
- [X] Editor - Add stepper to image editor. (On every click add new number to image)
- [X] Editor - Add blur to image editor.
- [] Editor - Undo/redu (Ctrl+Z)
- [] Settings - Refactor settings. Settings as a core view of the app not just dialog popup.
- [] UI/UX - Redesign current interface. Use [front end design skill](.github/skills/frontend-design/SKILL.md)

## Core Concepts

### Application Overview
Desktop screenshot application that operates in the background, captures screenshots via keyboard shortcuts, provides basic image editing, and automatically uploads to a server via SFTP.

### Platform Support
- Windows
- macOS
- Linux

### Key Features

#### 1. Background Operation
- App runs in system tray/taskbar
- Always accessible via tray icon
- Global keyboard listener for screenshot triggers

#### 2. Screenshot Capture
- User presses defined keyboard shortcut
- User selects region of screen to capture (partial screenshot)
- Screenshot is captured of selected area
- Image opens in built-in editor

#### 3. Image Editor
- Simple editing interface
- Add rectangular shapes/squares
- Add text annotations
- Save edited image

#### 4. Settings Management
- Image save directory configuration
- Customizable keyboard shortcuts
- SFTP upload configuration (host, port, username, password/key, remote path)
- Persistent settings storage

#### 5. Automatic Upload
- Upload screenshots via SFTP to configured server
- Upload after editing or immediate upload option
- Upload status feedback

#### 6. System Tray Integration
- Persistent tray icon while app runs in background
- Quick access menu from tray
- Show/hide main window
- Exit application option

## Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety and better DX
- **Vite** - Build tool (already configured)
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library

### Backend
- **Tauri** - Desktop app framework
- **Rust** - Backend logic and system integration

### Additional Dependencies (Anticipated)
- **tauri-plugin-global-shortcut** - Global keyboard shortcuts
- **tauri-plugin-fs** - File system access
- **ssh2** or **rust-sftp** - SFTP functionality
- **screenshots** or **xcap** - Cross-platform screenshot capture
- Canvas API or image manipulation library for editing

## Code Generation Guidelines

### Code Quality Standards
- Clean, self-documenting code
- Descriptive variable and function names
- Comments only when necessary to explain complex logic
- Follow language-specific idioms (Rust patterns, React hooks best practices)
- Type safety wherever possible

### Rust Guidelines
- Use Result<T, E> for error handling
- Leverage pattern matching
- Keep functions small and focused
- Use descriptive error messages
- Follow Rust naming conventions (snake_case for functions/variables)

### TypeScript/React Guidelines
- Functional components with hooks
- Custom hooks for reusable logic
- Proper TypeScript types (avoid `any`)
- Component composition over complex components

## Project Structure Considerations

### Tauri Commands (Rust → Frontend)
- `capture_screenshot` - Capture screen
- `save_image` - Save edited image
- `upload_to_sftp` - Upload via SFTP
- `get_settings` - Retrieve app settings
- `update_settings` - Update app settings
- `register_global_shortcut` - Register keyboard shortcuts

### Frontend Components
- SystemTray menu
- Editor canvas
- Settings panel
- Upload status indicator
- Notification system

## Additional Considerations

### Security
- Securely store SFTP credentials (consider encryption)
- Validate file paths and user inputs
- Handle permissions properly

### User Experience
- Visual feedback for all operations
- Error handling with user-friendly messages
- Loading states during uploads
- Keyboard shortcuts help/documentation

### Performance
- Efficient image processing
- Non-blocking operations
- Optimize for quick screenshot capture

### Future Enhancements (Optional)
- Cloud storage integrations (S3, Dropbox, etc.)
- More editing tools (arrows, circles, blur, pixelate)
- Screenshot history
- Animated GIF support
- Full screen capture option
- Multiple monitor support

## Development Notes

### Commands
- **Start development server**: `pnpm tauri dev`
- **Build production app**: `pnpm tauri build`
- **Add shadcn component**: `pnpm dlx shadcn@latest add <component-name>`

### Rust Learning Resources
- When confused about Rust syntax or concepts, ask for explanations
- Focus on understanding: ownership, borrowing, Result/Option types
- Tauri-specific patterns will be explained as needed
