# Deployment Guide for Vercel

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with this repository
- pnpm package manager

## Deployment Steps

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   pnpm add -g vercel
   ```

2. **Deploy from project directory**:
   ```bash
   cd returnneosiam-pro
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new one
   - Select the appropriate settings
   - Confirm deployment

### Option 2: Using GitHub Integration

1. **Push code to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/import
   - Select your GitHub repository
   - Configure build settings (should auto-detect)
   - Click Deploy

## Environment Variables

If you need to set environment variables for Firebase or other services:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add your variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - etc.

## Build Configuration

The project uses:
- **Framework**: Vite with React
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

These are configured in `vercel.json`.

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Verify environment variables are set
- Check build logs in Vercel dashboard

### Application Not Loading
- Check browser console for errors
- Verify Firebase configuration
- Check that all API keys are properly set

## Post-Deployment

After successful deployment:
1. Your site will be available at `https://[project-name].vercel.app`
2. You can set up a custom domain in Vercel settings
3. Enable automatic deployments from GitHub

## Rollback

To rollback to a previous deployment:
1. Go to Vercel project dashboard
2. Navigate to Deployments
3. Click on the deployment you want to restore
4. Click "Promote to Production"
