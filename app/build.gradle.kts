plugins {
    id("com.android.application")
}

android {
    namespace = "com.arena151.game"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.arena151.game"
        minSdk = 26          // Android 8.0+
        targetSdk = 35
        versionCode = 6
        versionName = "6.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Signed with the debug key so the release APK installs directly on your own phone.
            // Create a real signing key before publishing anywhere.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
