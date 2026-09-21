package com.embroidex

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeDownloadModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NativeDownloadManager"

    @ReactMethod
    fun downloadFile(url: String, fileName: String, token: String?, title: String?, promise: Promise) {
        try {
            val downloadManager = reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager
            if (downloadManager == null) {
                promise.reject("ERR_NO_MANAGER", "Android DownloadManager service is unavailable")
                return
            }

            val uri = Uri.parse(url)
            val request = DownloadManager.Request(uri)
                .setTitle(title ?: fileName)
                .setDescription("Downloading $fileName")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            if (!token.isNullOrBlank()) {
                request.addRequestHeader("Authorization", "Bearer $token")
            }

            val downloadId = downloadManager.enqueue(request)
            promise.resolve(downloadId.toString())
        } catch (e: Exception) {
            promise.reject("ERR_DOWNLOAD_FAILED", e.message, e)
        }
    }
}
