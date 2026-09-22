package com.embroidex

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileOutputStream

class NativeFilePickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null
    private var isImagePicker: Boolean = false

    companion object {
        private const val REQUEST_CODE_IMAGE = 4101
        private const val REQUEST_CODE_DOCUMENT = 4102
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "NativeFilePicker"

    @ReactMethod
    fun pickImage(multiple: Boolean, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ERR_NO_ACTIVITY", "Activity not available")
            return
        }

        pendingPromise = promise
        isImagePicker = true

        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "image/*"
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            activity.startActivityForResult(
                Intent.createChooser(intent, "Select Design Photo"),
                REQUEST_CODE_IMAGE
            )
        } catch (e: Exception) {
            pendingPromise?.reject("ERR_INTENT_FAILED", e.message, e)
            pendingPromise = null
        }
    }

    @ReactMethod
    fun pickDocument(promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ERR_NO_ACTIVITY", "Activity not available")
            return
        }

        pendingPromise = promise
        isImagePicker = false

        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "*/*"
                val mimes = arrayOf(
                    "application/zip",
                    "application/x-zip-compressed",
                    "application/octet-stream"
                )
                putExtra(Intent.EXTRA_MIME_TYPES, mimes)
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            activity.startActivityForResult(
                Intent.createChooser(intent, "Select Design File (.zip / .emb)"),
                REQUEST_CODE_DOCUMENT
            )
        } catch (e: Exception) {
            pendingPromise?.reject("ERR_INTENT_FAILED", e.message, e)
            pendingPromise = null
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        val promise = pendingPromise ?: return

        if (requestCode != REQUEST_CODE_IMAGE && requestCode != REQUEST_CODE_DOCUMENT) {
            return
        }

        pendingPromise = null

        if (resultCode != Activity.RESULT_OK || data == null) {
            promise.resolve(Arguments.createArray())
            return
        }

        try {
            val results: WritableArray = Arguments.createArray()
            val clipData = data.clipData

            if (clipData != null && clipData.itemCount > 0) {
                for (i in 0 until clipData.itemCount) {
                    val uri = clipData.getItemAt(i).uri
                    val map = processUri(uri, isImagePicker)
                    if (map != null) {
                        results.pushMap(map)
                    }
                }
            } else if (data.data != null) {
                val map = processUri(data.data!!, isImagePicker)
                if (map != null) {
                    results.pushMap(map)
                }
            }

            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("ERR_PARSE_FAILED", e.message, e)
        }
    }

    override fun onNewIntent(intent: Intent) {
        // No-op
    }

    private fun processUri(uri: Uri, isImage: Boolean): WritableMap? {
        val contentResolver = reactContext.contentResolver
        var fileName = "file_${System.currentTimeMillis()}"
        var fileSize: Long = 0

        // Extract metadata from ContentResolver
        contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex != -1) {
                    val name = cursor.getString(nameIndex)
                    if (!name.isNullOrBlank()) fileName = name
                }
                if (sizeIndex != -1) {
                    fileSize = cursor.getLong(sizeIndex)
                }
            }
        }

        val mimeType = contentResolver.getType(uri) ?: if (isImage) "image/jpeg" else "application/octet-stream"

        // Copy stream to cache directory
        val cacheDir = File(reactContext.cacheDir, "picker_uploads")
        if (!cacheDir.exists()) cacheDir.mkdirs()

        val destFile = File(cacheDir, "${System.currentTimeMillis()}_$fileName")
        var base64Data: String? = null

        contentResolver.openInputStream(uri)?.use { inputStream ->
            val bytes = inputStream.readBytes()
            FileOutputStream(destFile).use { outputStream ->
                outputStream.write(bytes)
            }
            if (fileSize == 0L) {
                fileSize = bytes.size.toLong()
            }
            if (isImage && bytes.isNotEmpty()) {
                val b64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                base64Data = "data:$mimeType;base64,$b64"
            }
        }

        val map = Arguments.createMap()
        map.putString("uri", "file://${destFile.absolutePath}")
        map.putString("name", fileName)
        map.putString("type", mimeType)
        map.putDouble("size", fileSize.toDouble())
        if (base64Data != null) {
            map.putString("base64", base64Data)
        }

        return map
    }
}
