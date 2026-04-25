package com.mobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class AppBuildInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "AppBuildInfo"

  override fun getConstants(): MutableMap<String, Any> =
      mutableMapOf(
          "versionName" to BuildConfig.APP_VERSION_NAME,
          "versionCode" to BuildConfig.APP_VERSION_CODE,
          "buildTimestamp" to BuildConfig.APP_BUILD_TIMESTAMP,
      )
}
