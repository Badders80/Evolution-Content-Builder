# Evolution Content Builder - Testing Guide

## 🧪 Manual Testing Workflow

### Prerequisites
1. **Backend running**: `python app.py` at http://localhost:8000
2. **Frontend running**: `npm run dev` at http://localhost:5173

### Test Scenario 1: Basic Content Analysis

1. **Open the app** at http://localhost:5173
2. **In Left Panel**:
   - Select template: "Post-Race Report"
   - Select LLM: "Gemini 2.0 Flash Exp"
   - Paste sample content in "Content Text":
     ```
     Our champion horse Thunder Strike won the Melbourne Cup today with an amazing performance. 
     The jockey rode brilliantly and the horse showed incredible speed in the final stretch. 
     This is a fantastic victory for Evolution Stables and all our supporters.
     ```
3. **Click "Analyze Content"**
4. **Expected Result**:
   - Analysis summary appears at top of Editor Panel
   - Should show: ~50 words, positive sentiment, keywords like "champion", "victory", "fantastic"
   - Readability: "Easy to read - good length"

### Test Scenario 2: AI Suggestion Generation

1. **Continue from Test 1** (with content pasted)
2. **In Left Panel**:
   - Click "Generate Suggestion"
3. **Expected Result**:
   - Button shows spinner: "Generating..."
   - After ~2-5 seconds, content auto-fills in Editor Panel:
     - Title field populated
     - Subtitle field populated (if generated)
     - Main editor populated with polished body text
   - Preview Panel updates automatically

### Test Scenario 3: Manual Editing & Preview

1. **In Editor Panel**:
   - Type a custom headline: "Thunder Strike Dominates Melbourne Cup"
   - Type a subtitle: "Evolution Stables Claims Historic Victory"
   - Edit the body text in the main editor
2. **Watch Preview Panel**:
   - Should update in real-time as you type
   - Preview shows Evolution Stables branding
   - Content formatted with proper spacing

### Test Scenario 4: Device Preview Toggle

1. **In Preview Panel** (top right):
   - Click "Desktop" - preview at full width
   - Click "Tablet" - preview scales down
   - Click "Phone" - preview shows mobile size
2. **Expected Result**:
   - Preview smoothly transitions between sizes
   - Content remains readable at all sizes

### Test Scenario 5: Slider Controls & Rewrite

1. **In Editor Panel** (bottom controls):
   - Adjust "Tone" slider: Move to "Casual" (right side)
   - Adjust "Creativity" slider: Set to 80%
   - Adjust "Max Words" slider: Set to 200
2. **Click "Ask Gemini for Rewrite"**
3. **Expected Result**:
   - Suggestion box appears below controls
   - Shows AI-generated rewrite
   - "Apply" button copies to editor
   - "Copy" button copies to clipboard
   - "Dismiss" button hides suggestion

### Test Scenario 6: Asset Selection

1. **In Left Panel** - "Select Assets" section:
   - Click on 2-3 asset cards (e.g., "Evolution Logo", "Gold Trophy")
   - Selected assets show gold border
   - Click again to deselect
2. **Expected Result**:
   - Visual feedback on selection
   - State persists while editing

### Test Scenario 7: Attachments (Drag & Drop)

1. **In Left Panel** - "Attachments" section:
   - Drag a text file or image onto the drop zone
   - OR click the zone to browse files
2. **Expected Result**:
   - File appears in list below drop zone
   - Shows filename
   - "×" button removes attachment
   - (Note: Files stored locally, not uploaded to server yet)

### Test Scenario 8: Tagline Selection

1. **In Left Panel** - "Tagline" dropdown:
   - Select "Excellence in Every Stride"
   - Check Preview Panel footer - should update
   - Select "Custom..."
   - Type custom tagline: "Racing Towards Glory"
2. **Expected Result**:
   - Preview footer updates immediately
   - Custom input appears when "Custom..." selected

### Test Scenario 9: Export HTML

1. **In Preview Panel** (bottom):
   - Click "Export HTML"
2. **Expected Result**:
   - Browser downloads file: `post-race-report.html`
   - Open file in browser
   - Should show standalone HTML with Evolution branding
   - Dark theme, gold accents, proper formatting

### Test Scenario 10: Export Markdown

1. **In Preview Panel** (bottom):
   - Click "Export Markdown"
2. **Expected Result**:
   - Browser downloads file: `post-race-report.md`
   - Open in text editor
   - Should show: `# Title\n\n## Subtitle\n\nBody content`

### Test Scenario 11: Template Switching

1. **In Left Panel**:
   - Change template from "Post-Race Report" to "Race Day Update"
2. **Expected Result**:
   - Top bar updates to show new template name
   - Preview Panel header shows new template
   - All content preserved

### Test Scenario 12: Error Handling

1. **Stop the backend** (Ctrl+C in backend terminal)
2. **In Left Panel**:
   - Click "Analyze Content"
3. **Expected Result**:
   - Red error toast appears at bottom center
   - Shows message: "Analysis failed: ..."
   - Click "×" to dismiss
   - Button re-enables after error

## 🐛 Known Issues to Watch For

- **TypeScript warnings**: `lucide-react` import errors are false positives - code runs fine
- **First API call**: May be slow (~5s) as Gemini initializes
- **Large content**: >1000 words may slow down preview rendering
- **File uploads**: Currently local only - not persisted to backend

## ✅ Success Criteria

All tests should pass with:
- ✅ No console errors (except TypeScript warnings)
- ✅ Smooth UI interactions
- ✅ Real-time preview updates
- ✅ API calls complete successfully
- ✅ Exports download correctly
- ✅ Error states handled gracefully

## 🔧 Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:8000/

# Restart backend
cd /mnt/e/Evolution-Content-Builder
python app.py
```

### Frontend not loading
```bash
# Check if frontend is running
curl http://localhost:5173/

# Restart frontend
cd /mnt/e/Evolution-Content-Builder/builder-ui
npm run dev
```

### CORS errors
- Ensure backend CORS allows `http://localhost:5173`
- Check `app.py` origins list includes frontend URL

### Gemini API errors
- Check `GEMINI_API_KEY` is set in `app.py`
- Verify API key is valid
- Check internet connection

## 📊 Performance Benchmarks

Expected response times:
- **Analyze**: 200-500ms
- **Suggest**: 2-5 seconds (Gemini API)
- **Preview update**: <50ms (instant)
- **Export**: <100ms

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Mark implementation complete
2. 📝 Document any bugs found
3. 🚀 Ready for feature additions:
   - File upload to backend
   - Draft save/load
   - ComfyUI integration
   - Batch processing
