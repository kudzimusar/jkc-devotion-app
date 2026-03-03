# GitHub Pages Setup Guide

## ⚠️ Important: Manual Setup Required

The GitHub Actions workflows have been successfully created and pushed to your repository, but **GitHub Pages needs to be enabled manually** through the GitHub web interface. The GitHub token used for automation doesn't have permissions to enable Pages.

## 📋 Step-by-Step Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/kudzimusar/jkc-devotion-app
2. Click on **Settings** tab
3. Scroll down to the **Pages** section (in the left sidebar)
4. Under **Build and deployment**, click **Configure**
5. Set the following options:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
6. Click **Save**

### 2. Verify GitHub Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Trigger Deployment

After enabling Pages, you can trigger a deployment in two ways:

**Option A: Push a new commit**
```bash
cd jkc-devotion-app
git commit --allow-empty -m "Trigger GitHub Pages deployment"
git push https://x-access-token:$GITHUB_TOKEN@github.com/kudzimusar/jkc-devotion-app.git main
```

**Option B: Manually trigger the workflow**
1. Go to **Actions** tab in your repository
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select `main` branch and click **Run workflow**

### 4. Monitor Deployment

1. Go to the **Actions** tab
2. Click on the latest **Deploy to GitHub Pages** run
3. Wait for the workflow to complete (usually takes 1-2 minutes)
4. If successful, you'll see a green checkmark

### 5. Access Your Live Site

Once deployment is successful, your app will be available at:
```
https://kudzimusar.github.io/jkc-devotion-app/
```

## 🔍 Troubleshooting

### Deployment Failed

If the deployment fails, check the workflow logs:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Review the error messages in the logs

Common issues:
- **Pages not enabled**: Follow step 1 above
- **Permissions issue**: Follow step 2 above
- **Workflow syntax error**: Check the workflow YAML files

### CI Workflow Failed

The CI workflow validates your code. If it fails:
1. Check the CI workflow logs
2. Fix any syntax errors or missing files
3. Push the fixes

### Issue Tracker Failed

The issue tracker workflow creates automated issues. If it fails:
1. Check if you have issues enabled in your repository
2. Verify the workflow has write permissions
3. Check the workflow logs for specific errors

## 📊 What's Automated

Once set up, the following will happen automatically:

### On Every Push to Main:
- ✅ CI validation runs (checks HTML, CSS, JS, JSON)
- ✅ Deployment to GitHub Pages
- ✅ Deployment issue created for tracking

### Weekly:
- ✅ Weekly report issue created
- ✅ Statistics and changes summary

### On Pull Requests:
- ✅ CI validation runs
- ✅ Preview deployment (if configured)

## 🎯 Next Steps

1. **Complete the manual setup** (steps 1-2 above)
2. **Trigger the first deployment** (step 3)
3. **Verify the live site** works correctly
4. **Share the URL** with your church members

## 📱 Testing the PWA

After deployment, test the PWA features:
1. Open the site in Chrome/Edge on mobile
2. Look for the "Install App" option in the browser menu
3. Install it to your home screen
4. Test offline functionality by turning off internet

## 🔄 Future Updates

To update the app:
1. Make changes to the files
2. Commit and push to main branch
3. GitHub Actions will automatically deploy
4. Changes will be live in 1-2 minutes

## 📞 Support

If you encounter any issues:
1. Check the Actions tab for workflow logs
2. Review this setup guide
3. Check GitHub Pages documentation: https://docs.github.com/en/pages

---

**Note**: The workflows are already configured and ready to use. You just need to enable GitHub Pages manually through the web interface, and everything else will work automatically!