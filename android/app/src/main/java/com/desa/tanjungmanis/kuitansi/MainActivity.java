package com.desa.tanjungmanis.kuitansi;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private String cameraPhotoPath;
    private static final int REQUEST_PERMISSIONS = 1001;
    private static final int FILE_CHOOSER_REQUEST_CODE = 2001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        setupWebSettings();
        checkAndRequestPermissions();

        // Handle Android Back Button
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void setupWebSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // Native PDF Printing & File Export Interface
        WebAppInterface webAppInterface = new WebAppInterface(this);
        webView.addJavascriptInterface(webAppInterface, "AndroidPrinter");
        webView.addJavascriptInterface(webAppInterface, "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("https://wa.me/") || url.startsWith("whatsapp://") || url.startsWith("tel:") || url.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return false;
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                File photoFile = null;
                try {
                    photoFile = createImageFile();
                    takePictureIntent.putExtra("PhotoPath", cameraPhotoPath);
                } catch (IOException ignored) {}

                if (photoFile != null) {
                    Uri photoURI = FileProvider.getUriForFile(MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            photoFile);
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                } else {
                    takePictureIntent = null;
                }

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("image/*");

                Intent[] intentArray;
                if (takePictureIntent != null) {
                    intentArray = new Intent[]{takePictureIntent};
                } else {
                    intentArray = new Intent[0];
                }

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Pilih Foto Bukti Serah Terima");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                return true;
            }
        });
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void printDocument(String jobName) {
            runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null) {
                        String name = (jobName != null && !jobName.trim().isEmpty()) ? jobName.trim() : "BAST_Kuitansi_Desa";
                        PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter(name);
                        PrintAttributes.Builder builder = new PrintAttributes.Builder();
                        builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
                        builder.setColorMode(PrintAttributes.COLOR_MODE_COLOR);
                        printManager.print(name, printAdapter, builder.build());
                    } else {
                        Toast.makeText(MainActivity.this, "Layanan Cetak PDF tidak tersedia di HP ini", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Gagal membuka Cetak PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void saveAndOpenFile(String base64Data, String fileName, String mimeType) {
            runOnUiThread(() -> {
                try {
                    String cleanB64 = base64Data;
                    if (cleanB64.contains(",")) {
                        cleanB64 = cleanB64.substring(cleanB64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanB64, Base64.DEFAULT);

                    // 1. Simpan ke App External Files (bisa diakses FileProvider untuk Intent View & Share)
                    File appDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (appDir != null && !appDir.exists()) {
                        appDir.mkdirs();
                    }
                    File appFile = new File(appDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(appFile)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }

                    // 2. Simpan juga ke Public Downloads HP agar muncul di File Manager / Download HP
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            ContentValues values = new ContentValues();
                            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                            Uri publicUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                            if (publicUri != null) {
                                try (OutputStream os = getContentResolver().openOutputStream(publicUri)) {
                                    if (os != null) {
                                        os.write(fileBytes);
                                        os.flush();
                                    }
                                }
                            }
                        } else {
                            File pubDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                            if (pubDownloads != null && !pubDownloads.exists()) {
                                pubDownloads.mkdirs();
                            }
                            File pubFile = new File(pubDownloads, fileName);
                            try (FileOutputStream fos = new FileOutputStream(pubFile)) {
                                fos.write(fileBytes);
                                fos.flush();
                            }
                            Intent scanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                            scanIntent.setData(Uri.fromFile(pubFile));
                            sendBroadcast(scanIntent);
                        }
                    } catch (Exception ignored) {}

                    // 3. Buka File langsung dengan Intent Chooser (WPS Office, Microsoft Excel, Spreadsheet)
                    Uri contentUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            appFile
                    );

                    Intent viewIntent = new Intent(Intent.ACTION_VIEW);
                    viewIntent.setDataAndType(contentUri, mimeType);
                    viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                    try {
                        Intent chooser = Intent.createChooser(viewIntent, "Buka " + fileName + " Dengan:");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                        Toast.makeText(MainActivity.this, "✅ File tersimpan di folder Download: " + fileName, Toast.LENGTH_LONG).show();
                    } catch (ActivityNotFoundException e) {
                        // Jika belum ada aplikasi Excel/WPS di HP, buka menu Bagikan (WhatsApp/Drive/Email)
                        Intent shareIntent = new Intent(Intent.ACTION_SEND);
                        shareIntent.setType(mimeType);
                        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                        shareIntent.putExtra(Intent.EXTRA_SUBJECT, fileName);
                        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        Intent shareChooser = Intent.createChooser(shareIntent, "Bagikan " + fileName + " Ke:");
                        shareChooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(shareChooser);
                        Toast.makeText(MainActivity.this, "✅ File tersimpan di Download. Silakan pilih aplikasi untuk membuka.", Toast.LENGTH_LONG).show();
                    }

                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "Gagal menyimpan file: " + ex.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void shareFile(String base64Data, String fileName, String mimeType) {
            runOnUiThread(() -> {
                try {
                    String cleanB64 = base64Data;
                    if (cleanB64.contains(",")) {
                        cleanB64 = cleanB64.substring(cleanB64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanB64, Base64.DEFAULT);

                    File appDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (appDir != null && !appDir.exists()) {
                        appDir.mkdirs();
                    }
                    File appFile = new File(appDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(appFile)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }

                    Uri contentUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            appFile
                    );

                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType(mimeType);
                    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, fileName);
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    Intent chooser = Intent.createChooser(shareIntent, "Bagikan " + fileName + " Ke:");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "Gagal membagikan: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void saveImageToGallery(String base64Data, String fileName) {
            runOnUiThread(() -> {
                try {
                    String cleanB64 = base64Data;
                    if (cleanB64.contains(",")) {
                        cleanB64 = cleanB64.substring(cleanB64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanB64, Base64.DEFAULT);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/KuitansiDesa");
                        Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                                if (os != null) {
                                    os.write(fileBytes);
                                    os.flush();
                                }
                            }
                        }
                    } else {
                        File picDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "KuitansiDesa");
                        if (!picDir.exists()) picDir.mkdirs();
                        File dest = new File(picDir, fileName);
                        try (FileOutputStream fos = new FileOutputStream(dest)) {
                            fos.write(fileBytes);
                            fos.flush();
                        }
                        Intent scanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                        scanIntent.setData(Uri.fromFile(dest));
                        sendBroadcast(scanIntent);
                    }

                    Toast.makeText(MainActivity.this, "✅ Foto kuitansi berhasil disimpan ke Galeri HP (" + fileName + ")", Toast.LENGTH_LONG).show();
                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "Gagal menyimpan gambar: " + ex.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "BAST_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(imageFileName, ".jpg", storageDir);
        cameraPhotoPath = "file:" + image.getAbsolutePath();
        return image;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }
            Uri[] results = null;

            if (resultCode == AppCompatActivity.RESULT_OK) {
                if (data == null || data.getData() == null) {
                    if (cameraPhotoPath != null) {
                        results = new Uri[]{Uri.parse(cameraPhotoPath)};
                    }
                } else {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void checkAndRequestPermissions() {
        List<String> listPermissionsNeeded = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            listPermissionsNeeded.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            listPermissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            listPermissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }
        if (!listPermissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, listPermissionsNeeded.toArray(new String[0]), REQUEST_PERMISSIONS);
        }
    }
}
