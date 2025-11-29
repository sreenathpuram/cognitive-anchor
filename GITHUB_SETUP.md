# GitHub Setup for Cognitive Anchor

This repository has been configured to never commit API keys. Follow these steps to push to GitHub:

## Prerequisites
1. Ensure you have a GitHub account at `sreenathr@gmail.com`
2. Have git installed and configured

## Steps to Push to GitHub

### 1. Create a new repository on GitHub
- Go to https://github.com/new
- Repository name: `cognitive-anchor`
- Description: "Privacy-first mobile AI companion app for neurodegenerative support"
- Choose: Private (recommended for security)
- Click "Create repository"

### 2. Configure environment variables
Before running the app, set your OpenRouter API key:

**In Replit (recommended):**
1. Click Secrets tab in the left sidebar
2. Add a new secret: `OPENROUTER_API_KEY` 
3. Paste your OpenRouter API key (get from https://openrouter.ai)

**Locally (development):**
1. Copy `.env.example` to `.env`
2. Replace the placeholder with your actual OpenRouter API key
3. Never commit `.env` - it's in .gitignore

### 3. Push to GitHub
Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Set remote origin
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/cognitive-anchor.git

# Configure git user (one time)
git config user.email "sreenathr@gmail.com"
git config user.name "sreenathr"

# Push to GitHub
git branch -M main
git push -u origin main
```

## What's Protected
✓ `.env` files are ignored (never committed)  
✓ API keys must be stored in environment variables
✓ All sensitive credentials stay out of version control
✓ GitHub integration handles secure authentication

## Running the App
```bash
npm install
npm run dev
```

The app will read `OPENROUTER_API_KEY` from:
1. Replit Secrets (if available)
2. `.env` file (if running locally)

## Features
- Conversational AI with OpenRouter API
- Camera-based vision analysis
- Local memory storage with AsyncStorage
- Voice interaction with text-to-speech
- Caregiver dashboard
- Life story conversational mode
- Proactive daily nudges

Built with React Native, Expo, and TypeScript.
