# Environment Variables Manager

A beautiful and intuitive desktop application built with Electron.js for managing environment variables locally. Store, edit, and organize your environment variables with a modern, user-friendly interface and full .env file support.

![Environment Variables Manager](https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800)

## Features

- ✨ **Modern UI**: Clean, responsive design with beautiful animations
- 🔒 **Local Storage**: All data stored securely in local JSON files   
- 📝 **Full CRUD Operations**: Create, Read, Update, and Delete environment variables
- 🔍 **Search & Filter**: Quickly find variables with real-time search
- 📤 **Import/Export**: Backup and restore your environment variables in .env or JSON format
- ⌨️ **Keyboard Shortcuts**: Efficient workflow with keyboard navigation
- 🌐 **Cross-Platform**: Works on Windows, macOS, and Linux
- 🎯 **Validation**: Prevents duplicate keys and empty values
- 📋 **Copy to Clipboard**: One-click copying of variable values
- 🔧 **.env File Support**: Import and export standard .env files with comments and formatting

## Screenshots

### Main Interface
The main interface provides a clean, organized view of all your environment variables with easy-to-use controls for managing them.

### Add/Edit Variables
Simple form interface for adding new variables or editing existing ones with real-time validation.

### Import/Export
Support for both .env and JSON file formats with proper parsing and formatting.

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Windows-Specific Setup

**For Windows users, follow these additional steps:**

1. **Install Node.js for Windows**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version for better stability
   - Run the installer as Administrator if you encounter permission issues

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   # Option 1: Using npm
   npm start
   
   # Option 2: Using the Windows batch file
   run-windows.bat
   ```

4. **Building for Windows**
   ```bash
   # Build installer (.exe)
   npm run build:win
   
   # Build portable version
   npm run build:win-portable
   ```

**Windows Troubleshooting:**
- If you get "node is not recognized" error, restart your command prompt after installing Node.js
- If you get permission errors, run Command Prompt as Administrator
- If the app doesn't start, check Windows Defender or antivirus software isn't blocking it
- For build issues, ensure you have Visual Studio Build Tools installed

### Development Setup

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd environment-variables-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm start
   # or
   npm run dev
   ```

### Building for Production

To create distributable packages for your platform:

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Create distribution packages
npm run dist
```

Built applications will be available in the `dist/` directory.

## Usage

### Getting Started

1. **Launch the application**
   - Run `npm start` for development
   - Or run the built executable for your platform

2. **Add your first environment variable**
   - Enter a key (e.g., `API_KEY`) in the "Key" field
   - Enter the corresponding value in the "Value" field
   - Click "Save Variable"

3. **Manage your variables**
   - **Edit**: Click the edit icon next to any variable to modify it
   - **Delete**: Click the delete icon and confirm removal
   - **Copy**: Click the copy icon to copy the value to your clipboard
   - **Search**: Use the search box to filter variables by key or value

### Advanced Features

#### Import/Export with .env Support
- **Export**: Click the "Export .env" button to save all variables to a .env file
- **Import**: Click the "Import .env" button to load variables from a .env or JSON file
- **Multiple Formats**: Supports both .env and JSON file formats
- **Comments**: .env files with comments are properly handled
- **Quotes**: Values with spaces or special characters are automatically quoted
- Importing will merge with existing variables (duplicates will be overwritten)

#### .env File Format Support
The application fully supports standard .env file format:
```
# Comments are supported
API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
DEBUG=true
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Keyboard Shortcuts
- `Ctrl/Cmd + N`: Focus on the key input field to add a new variable
- `Escape`: Cancel current edit operation or close modal dialogs
- `Enter`: Submit the form when in input fields

#### Data Storage
- All environment variables are stored in `env.json` in your user data directory
- **Windows**: `%APPDATA%/electron-env-manager/env.json`
- **macOS**: `~/Library/Application Support/electron-env-manager/env.json`
- **Linux**: `~/.config/electron-env-manager/env.json`

## File Structure

```
environment-variables-manager/
├── main.js              # Main Electron process
├── renderer.js          # Frontend logic and IPC communication  
├── index.html           # User interface
├── styles.css           # Custom styling
├── preload.js           # IPC bridge for secure communication
├── package.json         # Dependencies and scripts
├── sample.env           # Sample .env file for testing
└── README.md           # This file
```

## Development

### Architecture

The application follows Electron's recommended architecture:

- **Main Process** (`main.js`): Handles file operations, IPC communication, and window management
- **Renderer Process** (`renderer.js`): Manages the user interface and communicates with the main process
- **Preload Script** (`preload.js`): Secure bridge for IPC communication
- **IPC Communication**: Secure communication between processes using Electron's IPC system

### Key Components

1. **EnvironmentManager Class** (Main Process)
   - Handles file I/O operations
   - Manages application lifecycle
   - Provides IPC handlers for renderer communication
   - Parses and formats .env files

2. **EnvironmentUI Class** (Renderer Process)
   - Manages user interface interactions
   - Handles form validation and submission
   - Provides search and filtering functionality

### .env File Processing

The application includes robust .env file processing:
- **Parsing**: Converts .env format to key-value pairs
- **Formatting**: Converts key-value pairs back to .env format
- **Comments**: Preserves and handles comment lines
- **Quotes**: Automatically handles quoted values
- **Validation**: Ensures proper .env syntax

### Security

- Context isolation enabled for security
- Node integration disabled in renderer
- All file operations handled in the main process
- Input validation and sanitization
- Secure IPC communication through preload script

## Troubleshooting

### Common Issues

1. **App won't start**
   - Ensure Node.js is installed (version 16+)
   - Run `npm install` to install dependencies
   - Check for error messages in the console

2. **Variables not saving**
   - Check file permissions in the user data directory
   - Ensure the application has write access
   - Look for error notifications in the app

3. **Import/Export not working**
   - Verify file format (.env or JSON) for imports
   - Check file permissions for the target directory
   - Ensure the file isn't corrupted
   - For .env files, ensure proper KEY=value format

4. **.env import issues**
   - Check that the .env file uses proper KEY=value format
   - Ensure no extra spaces around the equals sign
   - Verify that comments start with # and are on separate lines

### Logs and Debugging

- Run with `npm run dev` to open developer tools
- Check the console for error messages
- Main process logs appear in the terminal
- Renderer process logs appear in the developer tools

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add comments for complex functionality
- Test on multiple platforms when possible
- Update documentation for new features
- Test .env file import/export functionality

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron.js](https://www.electronjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about the problem

---

**Happy Environment Variable Managing!** 🚀
