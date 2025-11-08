const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to add Network Security Configuration for Android
 * This allows HTTP cleartext traffic to our API server (85.113.27.42:8090)
 */
const withAndroidNetworkSecurityConfig = (config) => {
  // Step 1: Add reference to network_security_config in AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Add networkSecurityConfig attribute to application tag
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  // Step 2: Copy network_security_config.xml to android/app/src/main/res/xml/
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Copy network_security_config.xml
      const sourceFile = path.join(projectRoot, 'network_security_config.xml');
      const destFile = path.join(xmlDir, 'network_security_config.xml');

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log('✅ Network Security Config copied to Android resources');
      } else {
        console.warn('⚠️ network_security_config.xml not found in project root');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withAndroidNetworkSecurityConfig;
