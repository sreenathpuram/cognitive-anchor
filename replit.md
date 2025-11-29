# Cognitive Anchor

A privacy-first mobile AI companion app designed to provide support for individuals with neurodegenerative conditions and their caregivers.

## Overview

Cognitive Anchor is a compassionate AI assistant built for the Mobile AI Hackathon (Cactus X Nothing X Hugging Face). The app prioritizes local-first processing for privacy while offering cloud fallback for complex queries using OpenRouter API.

## Current State

**Version:** 1.0.0 (MVP - Hackathon Ready)

### Features Implemented

1. **Conversational AI Interface**
   - Chat with AI assistant powered by OpenRouter API (Claude 3.5 Haiku)
   - Context-aware responses using stored memories and user profile
   - Time-aware proactive nudges for meals, medications, and reminders
   - Voice output with text-to-speech using expo-speech
   - Life Story mode for guided memory sharing sessions

2. **Memory Vault**
   - Store and organize important memories (people, places, events, routines)
   - Add photos to memories using camera or image picker
   - Tag and categorize memories for easy retrieval
   - Local storage with AsyncStorage for privacy

3. **Camera Vision Recognition**
   - Real AI-powered image analysis using OpenRouter Vision API
   - Object, scene, and face description
   - Context-aware analysis connected to user's stored memories
   - Voice readout of analysis results

4. **Voice Interaction**
   - Text-to-speech for all AI responses using expo-speech
   - Listen button on each message to replay audio
   - Voice input modal with fallback to typing
   - Automatic voice readout for proactive nudges

5. **Life Story Mode**
   - Guided reminiscence sessions with the AI
   - Warm, therapeutic conversation prompts
   - Connected to user's stored memories for context
   - Accessible from home screen

6. **Caregiver Dashboard**
   - Activity summary (messages, memories, last active)
   - Status indicator (Active/Inactive based on daily activity)
   - Alerts and updates section
   - Quick contact calling
   - Recent memories overview

7. **User Profile**
   - Customizable profile with name and avatar
   - Three watercolor preset avatars (tree, flower, sun)
   - Custom photo upload option

8. **Emergency Contacts**
   - Store multiple emergency contacts
   - One-tap calling feature
   - Primary contact designation

9. **Settings**
   - Notification preferences
   - Voice interaction toggle
   - Accessibility options (high contrast, font size)
   - Data management (clear conversations, clear all data)

10. **Proactive Nudges**
    - Time-aware reminders throughout the day
    - Morning greetings, meal reminders, evening wind-down
    - Memory-based conversation starters
    - Personalized with user's name

## Architecture

### Tech Stack
- **Framework:** React Native with Expo SDK 54
- **Navigation:** React Navigation 7+
- **Storage:** AsyncStorage (local, privacy-first)
- **AI:** OpenRouter API with Claude 3.5 Haiku model
- **Voice:** expo-speech for text-to-speech
- **Design:** iOS 26 Liquid Glass aesthetic with accessibility focus

### Project Structure
```
├── screens/           # All screen components
│   ├── HomeScreen.tsx             # Chat interface with voice & life story
│   ├── MemoriesScreen.tsx         # Memory vault
│   ├── MemoryDetailScreen.tsx
│   ├── AddMemoryScreen.tsx
│   ├── CameraScreen.tsx           # AI vision recognition
│   ├── ProfileScreen.tsx          # User profile
│   ├── SettingsScreen.tsx
│   ├── EmergencyContactsScreen.tsx
│   └── CaregiverDashboardScreen.tsx
├── navigation/        # Navigation configuration
├── services/          # Business logic
│   ├── storage.ts     # Local storage utilities
│   ├── aiService.ts   # AI/chat/vision functionality
│   └── voiceService.ts # Voice/speech utilities
├── components/        # Reusable UI components
├── constants/         # Theme and design tokens
└── hooks/             # Custom React hooks
```

### API Configuration
- OpenRouter API key embedded in `services/aiService.ts`
- Model: `anthropic/claude-3.5-haiku`
- Max tokens: 500 for chat, 400 for vision, 400 for life story

## Design Guidelines

- **Primary Color:** #4A90E2 (Calm Blue)
- **Secondary Color:** #7B68EE (Gentle Purple)
- **Font Size:** 16-36px for accessibility
- **Touch Targets:** Minimum 48px
- **Typography:** San Francisco / System font
- **Style:** Calm, watercolor aesthetic optimized for elderly users

## Recent Changes

- 2024-11: Initial MVP development
- Implemented voice interaction with expo-speech
- Added real AI vision analysis via OpenRouter
- Built caregiver dashboard with activity summary
- Added Life Story conversational mode
- Enhanced proactive nudges with time-based scheduling
- Created all core screens and navigation

## User Preferences

- Privacy-first approach (local storage preferred)
- Large, accessible UI elements
- Calm, supportive tone in AI responses
- Simple, clean visual design
- Voice feedback for accessibility

## Development Notes

### Running the App
```bash
npm run dev
```
Scan QR code with Expo Go to test on physical device.

### Environment
- Uses Expo Go compatible libraries only
- No native dependencies requiring custom builds
- Web version available at localhost:8081

### Key Services

**aiService.ts:**
- `sendMessage()` - Chat with AI
- `analyzeImage()` - Vision analysis with base64 image
- `startLifeStorySession()` - Begin life story mode
- `continueLifeStory()` - Continue life story conversation
- `generateProactiveNudge()` - Time-based reminders

**voiceService.ts:**
- `speak()` - Text-to-speech output
- `stop()` - Stop current speech
- `updateSettings()` - Adjust rate/pitch

**storage.ts:**
- Memory CRUD operations
- Conversation history
- User profile and settings
- Emergency contacts

### Known Limitations
- Cactus SDK requires native build (incompatible with Expo Go)
- Speech-to-text requires native device (Expo Go limitation)
- Background location requires development build

### Hackathon Notes
- Primary AI: OpenRouter (Claude 3.5 Haiku) - works in Expo Go
- Cactus SDK: Ready for integration with native build
- All features functional in Expo Go for demo purposes
