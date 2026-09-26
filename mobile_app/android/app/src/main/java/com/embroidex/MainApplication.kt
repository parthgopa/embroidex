package com.embroidex

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(NativeDownloadPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)

    registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        applyRazorpayInsets(activity)
      }

      override fun onActivityStarted(activity: Activity) {
        applyRazorpayInsets(activity)
      }

      override fun onActivityResumed(activity: Activity) {
        applyRazorpayInsets(activity)
      }

      override fun onActivityPaused(activity: Activity) {}
      override fun onActivityStopped(activity: Activity) {}
      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
      override fun onActivityDestroyed(activity: Activity) {}
    })
  }

  private fun applyRazorpayInsets(activity: Activity) {
    val className = activity.componentName?.className ?: activity.javaClass.name
    if (!className.contains("CheckoutActivity", ignoreCase = true) && !className.contains("razorpay", ignoreCase = true)) {
      return
    }

    val window = activity.window ?: return
    val decorView = window.decorView ?: return

    val applyPadding = {
      val content = activity.findViewById<View>(android.R.id.content)
      val insets = ViewCompat.getRootWindowInsets(decorView)
      if (content != null && insets != null) {
        val bars = insets.getInsets(
          WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
        if (bars.top > 0 || bars.bottom > 0) {
          content.setPadding(bars.left, bars.top, bars.right, bars.bottom)
        }
      }
    }

    ViewCompat.setOnApplyWindowInsetsListener(decorView) { _, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val content = activity.findViewById<View>(android.R.id.content)
      content?.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }

    decorView.post {
      applyPadding()
    }
  }
}
