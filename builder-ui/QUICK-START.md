# 🚀 Quick Start Guide

## Get Up and Running in 2 Minutes

### Step 1: Start the Backend
```bash
cd /mnt/e/Evolution-Content-Builder
python app.py
```
✅ Backend runs at **http://localhost:8000**

### Step 2: Start the Frontend
```bash
cd /mnt/e/Evolution-Content-Builder/builder-ui
npm run dev
```
✅ Frontend runs at **http://localhost:5173**

### Step 3: Open in Browser
Navigate to: **http://localhost:5173**

---

## 📝 Your First Content Piece

### 1. Paste Raw Content (Left Panel)
In the "Content Text" area, paste:
```
Thunder Strike won the Melbourne Cup today with an incredible performance. 
The horse showed amazing speed and the jockey rode brilliantly. 
This is a fantastic victory for Evolution Stables.
```

### 2. Analyze It
Click **"Analyze Content"** button

**Result**: Analysis bar appears showing:
- Word count: ~30
- Sentiment: Positive
- Keywords: thunder, strike, fantastic, victory

### 3. Generate AI Suggestion
Click **"Generate Suggestion"** button

**Result**: After 2-5 seconds:
- Title auto-fills: "Thunder Strike Dominates Melbourne Cup"
- Body text appears in editor with polished content
- Preview updates automatically

### 4. Customize
- Edit the title/subtitle in the editor
- Adjust sliders: Tone, Creativity, Max Words
- Click "Ask Gemini for Rewrite" for variations

### 5. Preview & Export
- Toggle device view: Desktop → Tablet → Phone
- Click **"Export HTML"** to download
- Open the HTML file to see your content

---

## 🎯 Key Features at a Glance

### Left Panel
- **Template**: Choose content type (Post-Race Report, etc.)
- **LLM**: Select AI model (Gemini 2.0 Flash Exp)
- **Content Text**: Paste raw input
- **Assets**: Click to select visual assets
- **Tagline**: Choose or create custom tagline

### Middle Panel
- **Title/Subtitle**: Large input fields
- **Editor**: Markdown-enabled text area
- **Sliders**: Control tone, creativity, word count
- **AI Rewrite**: Get alternative versions

### Right Panel
- **Device Preview**: See how it looks on different screens
- **Live Updates**: Changes reflect instantly
- **Export**: Download as HTML or Markdown

---

## 💡 Pro Tips

1. **Start with Analysis**: Always analyze raw content first to see insights
2. **Use Sliders**: Adjust tone/creativity before generating suggestions
3. **Iterate**: Generate multiple suggestions with different slider values
4. **Preview Often**: Toggle device views to ensure readability
5. **Export Early**: Save versions as you work

---

## 🐛 Troubleshooting

### "Backend Offline" message?
- Check if `python app.py` is running
- Verify it's at http://localhost:8000
- Check for errors in backend terminal

### Suggestion takes too long?
- First call may take 5-10 seconds (Gemini initialization)
- Subsequent calls should be 2-5 seconds
- Check internet connection (Gemini API requires internet)

### Preview not updating?
- Check browser console for errors (F12)
- Refresh the page
- Verify content is in the editor

---

## 🎨 Customization

### Change Brand Colors
Edit `tailwind.config.cjs`:
```javascript
colors: {
  evoBg: '#0a0a0a',      // Main background
  evoPanel: '#111111',   // Panel backgrounds
  evoGold: '#d4a964',    // Accent color
}
```

### Change API Endpoint
Edit `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000'
```

---

## 📚 Next Steps

- Read `TESTING-GUIDE.md` for comprehensive testing scenarios
- See `IMPLEMENTATION-COMPLETE.md` for architecture details
- Check `README-UI.md` for feature documentation

---

**You're ready to build content! 🎉**
