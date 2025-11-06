const { Photo } = require('./models');
const path = require('path');

async function fixPhotoPaths() {
  try {
    console.log('🔧 Fixing photo paths in database...');

    // Get all photos
    const photos = await Photo.findAll();

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const photo of photos) {
      const oldPath = photo.filePath;

      // Check if path contains full Windows path (both forward and backward slashes)
      const hasFullPath = oldPath && (
        oldPath.includes('C:/probation_system/backend/uploads/') ||
        oldPath.includes('C:\\probation_system\\backend\\uploads\\') ||
        oldPath.includes('C:')
      );

      if (hasFullPath) {
        // Extract just the filename
        const filename = path.basename(oldPath);
        const newPath = `uploads/${filename}`;

        console.log(`Fixing: ${oldPath} -> ${newPath}`);

        await photo.update({ filePath: newPath });
        fixed++;
      } else if (oldPath && oldPath.startsWith('uploads/')) {
        alreadyCorrect++;
      } else {
        console.log(`⚠️  Unknown path format: ${oldPath}`);
      }
    }

    console.log(`✅ Fixed ${fixed} photo paths`);
    console.log(`✅ Already correct: ${alreadyCorrect}`);
    console.log(`📊 Total photos: ${photos.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing photo paths:', error);
    process.exit(1);
  }
}

// Run the fix
fixPhotoPaths();
