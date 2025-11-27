# Evolution Content Builder - UI

## 🎨 Three-Panel Layout

### Left Panel - Asset Browser & Uploads
- **Drag & drop** file uploads (images, text, markdown)
- **File browser** with thumbnails
- **Quick actions** for importing from URLs
- Supports: images (jpg, png, svg), text files (.md, .txt, .html)

### Middle Panel - Rich Editor
- **Markdown editor** with live formatting
- **Toolbar** for bold, italic, lists, links, code
- **Preview mode** to see rendered content
- **Title & subtitle** fields
- **Analyze button** to send content to AI

### Right Panel - AI Assistant
- **Analysis Tab**:
  - Sentiment analysis
  - Word count tracking
  - Keyword extraction
  - Readability score
  
- **Suggestions Tab**:
  - Tone slider (Formal → Casual)
  - Creativity slider (0-100%)
  - Target word count
  - Generate headlines, body text, CTAs
  - Copy suggestions with one click

## 🔌 API Integration

All panels connect to the FastAPI backend at `http://localhost:8000`:

- `POST /analyze` - Analyze content for insights
- `POST /suggest` - Generate AI suggestions with Gemini
- `POST /upload` - Upload files (planned)

## 🎨 Design System

### Colors (Evolution Stables Brand)
- **evoBg**: `#0a0a0a` - Main background
- **evoPanel**: `#111111` - Panel backgrounds
- **evoGold**: `#d4a964` - Accent color (buttons, highlights)

### Typography
- Headers: Semibold, tracking-wide
- Body: Regular, gray-300
- Accents: Gold for important elements

## 🚀 Features

✅ **Real-time Analysis** - Instant feedback on content quality  
✅ **AI-Powered Suggestions** - Gemini-powered content generation  
✅ **Markdown Support** - Write with formatting shortcuts  
✅ **Live Preview** - See your content rendered  
✅ **Backend Status** - Visual indicator for API connection  
✅ **Responsive Layout** - Three-panel design optimized for content creation

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast dev server
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **FastAPI** backend integration

## 📝 Usage

1. **Upload or paste content** in the left panel
2. **Write and format** in the middle editor
3. **Click "Analyze with AI"** to get insights
4. **Generate suggestions** in the right panel
5. **Copy and refine** AI-generated content

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🎯 Next Steps

- [ ] Implement file upload to backend
- [ ] Add template selection
- [ ] Save/load drafts
- [ ] Export to HTML/PDF
- [ ] ComfyUI integration for image generation
- [ ] Multi-language support
