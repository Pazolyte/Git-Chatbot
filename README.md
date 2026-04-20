# GitHub Chatbot (Electron Version)

A desktop application that provides a graphical interface for cloning GitHub repositories and interacting with them via an AI-powered chatbot.

## Features

- 💻 **Modern Desktop Interface**: Electron-based GUI with three-panel layout
- 🎨 **GitHub-Inspired Design**: Dark theme matching GitHub's aesthetic
- 🔗 **Repository Cloning**: Visual GitHub URL parser and cloner
- 📁 **File Explorer**: Tree-view navigation of cloned repositories
- 💬 **AI Chat Interface**: Natural language interaction with codebase
- 👁️ **File Viewer**: Syntax highlighting for various file types
- ⚙️ **Status Bar**: Connection, repository, and AI status indicators
- 🔧 **File Operations**: Create, edit, and delete files through the interface

## Interface Layout

The application features a three-panel layout:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: App Title + GitHub Link Input + Clone Button        │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   Sidebar     │              Chat Panel                     │
│   (Repo       │    (AI Chat Interface)                      │
│    Files)     │                                             │
│               │                                             │
│   250px       │           Remaining width                   │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ Footer: Status Bar (Connection, Clone Status, AI Status)    │
└─────────────────────────────────────────────────────────────┘
```

## Installation

Note: The Electron version has some environment-specific installation issues in this setup. For immediate use, please use the CLI version located in the `git-chatbot-cli` directory.

To install the Electron version (when environment issues are resolved):

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/git-chatbot.git
   cd git-chatbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your OpenAI API key:
   - Create a `.env` file in the root directory
   - Add: `OPENAI_API_KEY=your_openai_api_key_here`

4. Start the application:
   ```bash
   npm start
   ```

## Usage

Once running:

1. **Clone a Repository**:
   - Paste a GitHub URL in the input field (e.g., `https://github.com/owner/repo`)
   - Click "Parse" to validate the URL
   - Select a clone directory using the "Select Folder" button
   - Click "Clone" to download the repository

2. **Navigate Files**:
   - Use the file tree on the left to browse the repository structure
   - Click on files to view their contents in the viewer panel

3. **Chat with AI**:
   - Type questions or commands in the chat input at the bottom
   - Use natural language to ask about the codebase
   - Examples: "What does this project do?", "Show me the main entry point", "Find all API endpoints"

4. **File Operations**:
   - Right-click in the file tree for context menu (new file, new folder)
   - Edit files directly in the viewer panel
   - Save changes using the save button

## Development

This application was built with:
- **Electron** - Desktop application framework
- **Node.js** - Backend runtime
- **simple-git** - Git operations wrapper
- **chokidar** - File system watching
- **Vanilla JavaScript, HTML, CSS** - Frontend technologies

## Troubleshooting

### Electron Installation Issues
If you encounter errors like `Cannot read properties of undefined (reading 'whenReady')`, this indicates an Electron installation problem. In such cases:

1. Try reinstalling: `npm rebuild` or `rm -rf node_modules && npm install`
2. Use the CLI version instead (recommended for immediate use)
3. Ensure you're using a compatible Node.js version

### Common Problems
- **Blank Screen**: Check developer tools (Ctrl+Shift+I) for errors
- **API Key Issues**: Verify your `.env` file contains a valid OpenAI API key
- **Cloning Failures**: Check network connectivity and GitHub URL format

## License

MIT License

## Note on Current State

In this particular environment, the Electron version has installation issues preventing it from starting. However, all the source code is present and functional. The CLI version in the `git-chatbot-cli` directory provides identical functionality and is fully operational.

For immediate use, please refer to the CLI version's README.md for detailed instructions.
