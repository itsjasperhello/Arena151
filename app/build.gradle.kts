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
        versionCode = 29
        versionName = "14.6"
    }

    // One fixed signing key, kept in the repo, so every APK GitHub builds can install as an
    // update over the previous one (and keep your saves). Fine for a personal/class project;
    // use a private key stored as a secret before publishing anywhere.
    signingConfigs {
        create("arena") {
            storeFile = file("arena151.jks")
            storePassword = "arena151pass"
            keyAlias = "arena151"
            keyPassword = "arena151pass"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("arena")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("arena")
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
