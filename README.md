# wellness-buddy2

**WellnessBuddy** is an end-to-end encrypted prescription protocol & patient compliance platform built with React, Vite, Tailwind CSS, and Supabase Cloud Storage.

## Features
- **Practitioner Website Dashboard**:
  - Patient roster management with instant patient search and NEW tag indicators.
  - Practitioner guidance notes with live encrypted Supabase synchronization.
  - Prescribed supplement protocol builder with quick stack presets ("Peak Vitality", "Gut Health", "Cognitive Focus").
  - Medication history & days taken compliance timeline.
  - Dynamic patient registration & profile deletion.
- **Patient Mobile App**:
  - DOB & Name login with instant intake synchronization.
  - Daily supplement protocol checklist with confetti micro-animations upon dose completion.
  - Supplements Hub with timing badges (Empty Stomach, With Meal, Before Bed) and quote instructions.
  - Compliance Analytics with 100% adherence rate visual bar, active streak counter, and 7-day log dot matrix.
  - PDF & Text Regimen export capabilities.
- **Security & Replit Compatibility**:
  - AES-256 client-side encryption for health records before uploading to Supabase Storage.
  - Operates seamlessly on Replit without requiring local persistent storage.
