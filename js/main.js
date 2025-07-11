# Pull the latest changes
git pull

# Open the file for editing
nano js/main.js

# After saving and exiting nano, run the following:
git add js/main.js
git commit -m "refactor(main): Remove obsolete shader file loader"
git push origin main
