# Keep the JavaScript bridge if minification is ever enabled.
-keepclassmembers class com.arena151.game.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
