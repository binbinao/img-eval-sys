# Change: Add Core Evaluation System

## Why
This is the foundational change that establishes the core capabilities of the image evaluation system. We need to build the essential features that enable users to register, authenticate, upload images, and receive professional photographer-style evaluations using AI vision models.

## What Changes
- **User Authentication**: Registration and login functionality with session-based authentication
- **Image Evaluation Core**: Image upload, processing, AI analysis via Tencent Cloud Hunyuan Vision, and report generation
- **API Key Management**: Auto-generation of API keys upon user registration, one unique key per user
- **Database Schema**: MySQL tables for users, evaluation records, and API keys
- **Storage Integration**: Local file system for development, with COS integration structure for production

## Impact
- **Affected specs**: 
  - New capability: `user-auth` (user registration and authentication)
  - New capability: `image-evaluation` (core image evaluation functionality)
  - New capability: `api-key-management` (API key generation and validation)
- **Affected code**: 
  - Next.js app structure (API routes, pages, components)
  - Database models and migrations
  - Image processing pipeline
  - Tencent Cloud API integration
  - Authentication middleware
