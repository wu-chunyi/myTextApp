const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Config plugin to fix AndroidManifest merge conflicts.
 *
 * AppsFlyer SDK (transitive dependency) defines its own
 * `android:fullBackupContent` and `android:dataExtractionRules`,
 * which conflict with expo-secure-store's values.
 *
 * Adding `tools:replace` tells the manifest merger to use our values.
 */
function withAndroidManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (application) {
      // Ensure tools namespace is declared
      if (!androidManifest.manifest.$['xmlns:tools']) {
        androidManifest.manifest.$['xmlns:tools'] =
          'http://schemas.android.com/tools';
      }

      // Add tools:replace to resolve manifest merge conflicts
      application.$['tools:replace'] =
        'android:fullBackupContent,android:dataExtractionRules';
    }

    return config;
  });
}

module.exports = withAndroidManifestFix;
