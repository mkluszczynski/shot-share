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
- [X] Editor - Undo/redo (Ctrl+Z)
- [X] Settings - Refactor settings. Settings as a core view of the app not just dialog popup.
- [X] Tray - Update options: Take screenshot, partial screenshot, about, settings, upload settings
- [X] UI/UX - Redesign current interface. Use [front end design skill](.github/skills/frontend-design/SKILL.md)

## TODO Bug fixes

- [X] #001 Closing image editor by clicking system X casing editor to open on next screenshot trigger.
- [X] #002 Cannot cancel taking screenshot by pressing esc
- [X] #003 While being in image editor and clicking alt+tab or losing focus on editor, window is disappearing 
- [X] #004 Size of the window of image editor should be a bit bigger then taken screenshot automatically.
- [X] #005 While using other programs esc is not working. I guess that our app is overriding global esc.
- [X] #006 Taking small screenshot casing editor to shrink in size to much.

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

### Dependencies (Implemented)

#### Rust/Backend
- **tauri-plugin-global-shortcut** (v2) - Global keyboard shortcuts
- **tauri-plugin-fs** (v2) - File system access
- **tauri-plugin-dialog** (v2) - Native dialogs
- **tauri-plugin-clipboard-manager** (v2) - Clipboard operations
- **tauri-plugin-opener** (v2) - Open files/URLs
- **xcap** (v0.0.12) - Cross-platform screenshot capture
- **ssh2** (v0.9) - SFTP functionality
- **base64** (v0.22) - Image encoding/decoding
- **dirs** (v5) - Platform-specific directories
- **keyring** (v3) - Secure password storage
- **serde/serde_json** (v1) - JSON serialization
- **thiserror** (v2) - Error handling

#### Frontend
- **React** (v18.3.1) + **TypeScript** (v5.6.2)
- **Vite** (v6.0.3) - Build tool
- **Tailwind CSS** (v4.1.18) - Styling framework
- **konva** (v10.2.0) + **react-konva** (v18.2.10) - Canvas-based image editor
- **lucide-react** (v0.563.0) - Icon library
- **sonner** (v2.0.7) - Toast notifications
- **class-variance-authority** + **clsx** + **tailwind-merge** - Utility libraries

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
- `greet` - Test command
- `capture_full_screenshot` - Capture entire primary monitor, returns base64 data URL
- `capture_screenshot` - Capture screen region with coordinates, saves to file
- `save_base64_image` - Convert base64 data to PNG file
- `get_settings` - Retrieve app settings from JSON file
- `update_settings` - Update and persist app settings
- `test_sftp_connection` - Test SFTP connection with credentials
- `upload_to_sftp` - Upload file via SFTP to configured server
- `show_main_window` - Show and focus the main window
- `hide_main_window` - Hide the main window
- `register_shortcut` - Register new global screenshot shortcut
- `register_escape_shortcut` - Register global Escape key handler
- `unregister_escape_shortcut` - Unregister global Escape key handler

### Frontend Components
- **App.tsx** - Main application component, handles routing and state
- **RegionSelector.tsx** - Fullscreen overlay for region selection
- **ImageEditor/** - Canvas-based image editor with tools
  - **ImageEditor.tsx** - Main editor component with Konva Stage
  - **EditorToolbar.tsx** - Tool selection, color picker, action buttons
  - **ShapeRenderer.tsx** - Renders all shapes on canvas
  - **TextEditorOverlay.tsx** - HTML overlay for text input
- **Sidebar.tsx** - Navigation sidebar with menu items
- **HomePage.tsx** - Landing page with features and quick start
- **GeneralSettings.tsx** - General settings (save directory, shortcuts)
- **SftpSettings.tsx** - SFTP upload configuration
- **ui/** - shadcn/ui components (button, dialog, input, label, sonner)

### Custom Hooks
- **useDrawing.ts** - Drawing logic for rectangle, arrow, blur tools
- **useHistory.ts** - Undo/redo functionality for shape history
- **useKeyboardShortcuts.ts** - Editor keyboard shortcuts (Delete, Escape, Ctrl+Z, Ctrl+Y)
- **useShapeSelection.ts** - Shape selection and transformer management
- **useTextEditing.ts** - Text annotation and stepper number tools

### Services
- **uploadService.ts** - SFTP upload with clipboard integration and toast notifications

### Type Definitions
- **editor.ts** - Tool types, Shape interfaces (RectShape, TextShape, ArrowShape, StepperShape, BlurShape)
- **settings.ts** - Settings and SftpConfig interfaces

## Additional Considerations

### Architecture

#### Backend (Rust)
- **main.rs** - Entry point, calls `shot_share_lib::run()`
- **lib.rs** - Main application logic with Tauri commands and event handlers
- **settings.rs** - Settings management with JSON file storage and OS keyring integration
- **sftp.rs** - SFTP uploader with SSH2 library, supports password authentication

#### System Tray Implementation
- Built with `tauri-plugin-tray-icon`
- Menu items: Take Screenshot, General Settings, Upload Settings, About, Quit
- Left-click shows main window
- Menu events trigger navigation and actions

#### Global Shortcuts
- Screenshot shortcut configurable (default: `CommandOrControl+Shift+S`)
- Escape key dynamically registered/unregistered during region selection
- Shortcut events emit to frontend via Tauri events

#### Window Management
- Main window starts hidden, shown via tray or shortcut
- Close button hides window instead of exiting (system tray persistence)
- Fullscreen mode for region selection
- Dynamic resizing based on screenshot dimensions

#### Settings Storage
- Settings saved to JSON file in user's config directory
- SFTP passwords stored securely in OS keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Settings interface: save directory, screenshot shortcut, SFTP config (host, port, username, password, remote path, base URL, clipboard option)

#### Image Editor Tools
- **Select** - Default tool for selecting and moving shapes
- **Rectangle** - Draw rectangular annotations
- **Text** - Add text annotations
- **Arrow** - Draw directional arrows
- **Stepper** - Sequential numbered circles (auto-increments)
- **Blur** - Pixelated blur regions for censoring

### Security
- SFTP passwords stored in OS keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- File paths validated before operations
- Connection timeouts prevent hanging (10 second timeout)
- Credentials never logged or exposed in error messages

### User Experience
- Toast notifications for all operations (via sonner)
- Error handling with user-friendly messages
- Loading states during uploads
- Keyboard shortcuts: Ctrl+Z/Y (undo/redo), Delete (remove shape), Escape (cancel/deselect)
- Auto-clipboard copy of uploaded image URLs
- Window auto-sizing based on screenshot dimensions
- Dark theme with electric cyan accents

### Performance
- Efficient image processing
- Non-blocking operations
- Optimize for quick screenshot capture

### Future Enhancements (Optional)
- Cloud storage integrations (S3, Dropbox, etc.)
- More editing tools (circles, freehand drawing)
- Screenshot history browser
- Animated GIF/video recording support
- Full screen capture option
- Multiple monitor support
- Annotation templates
- Image filters and effects

## Development Notes

### Commands
- **Start development server**: `pnpm tauri dev`
- **Build production app**: `pnpm tauri build`
- **Add shadcn component**: `pnpm dlx shadcn@latest add <component-name>`

### Rust Learning Resources
- When confused about Rust syntax or concepts, ask for explanations
- Focus on understanding: ownership, borrowing, Result/Option types
- Tauri-specific patterns will be explained as needed
