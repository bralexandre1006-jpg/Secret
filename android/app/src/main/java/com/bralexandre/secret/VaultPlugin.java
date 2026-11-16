package com.bralexandre.secret;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.ClipData;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Size;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "Vault",
    permissions = {
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage")
    }
)
public class VaultPlugin extends Plugin {

    private final ExecutorService io = Executors.newSingleThreadExecutor();

    private File mediaDir() {
        File d = new File(getContext().getFilesDir(), "vault/media");
        d.mkdirs();
        return d;
    }

    private File thumbDir() {
        File d = new File(getContext().getFilesDir(), "vault/thumbs");
        d.mkdirs();
        return d;
    }

    // ---------- Import ----------

    @PluginMethod
    public void pickMedia(PluginCall call) {
        boolean multiple = call.getBoolean("multiple", true);
        Intent intent;
        if (Build.VERSION.SDK_INT >= 33) {
            intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
            if (multiple) intent.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, MediaStore.getPickImagesMaxLimit());
        } else {
            intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "image/*", "video/*" });
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);
        }
        startActivityForResult(call, intent, "pickResult");
    }

    @ActivityCallback
    private void pickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            JSObject r = new JSObject();
            r.put("items", new JSArray());
            call.resolve(r);
            return;
        }
        List<Uri> uris = new ArrayList<>();
        ClipData clip = data.getClipData();
        if (clip != null) {
            for (int i = 0; i < clip.getItemCount(); i++) uris.add(clip.getItemAt(i).getUri());
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        io.execute(() -> {
            JSArray items = new JSArray();
            int done = 0;
            for (Uri uri : uris) {
                try {
                    JSObject item = importUri(uri);
                    if (item != null) items.put(item);
                } catch (Exception ignored) {}
                done++;
                JSObject p = new JSObject();
                p.put("done", done);
                p.put("total", uris.size());
                notifyListeners("importProgress", p);
            }
            JSObject r = new JSObject();
            r.put("items", items);
            call.resolve(r);
        });
    }

    private JSObject importUri(Uri uri) throws Exception {
        ContentResolver cr = getContext().getContentResolver();
        String mime = cr.getType(uri);
        if (mime == null) mime = "application/octet-stream";
        boolean isVideo = mime.startsWith("video/");
        if (!isVideo && !mime.startsWith("image/")) return null;

        String ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
        if (ext == null) ext = isVideo ? "mp4" : "jpg";
        String id = UUID.randomUUID().toString();
        File out = new File(mediaDir(), id + "." + ext);

        try (InputStream in = cr.openInputStream(uri); OutputStream os = new FileOutputStream(out)) {
            if (in == null) return null;
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
        }

        long taken = queryDateTaken(uri);
        String name = queryName(uri);

        JSObject item = new JSObject();
        item.put("id", id);
        item.put("path", out.getAbsolutePath());
        item.put("type", isVideo ? "video" : "image");
        item.put("mime", mime);
        item.put("name", name);
        item.put("taken", taken);
        item.put("added", System.currentTimeMillis());

        File thumb = makeThumb(out, isVideo, id);
        if (thumb != null) item.put("thumb", thumb.getAbsolutePath());

        try {
            MediaMetadataRetriever mmr = new MediaMetadataRetriever();
            if (isVideo) {
                mmr.setDataSource(out.getAbsolutePath());
                String d = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                if (d != null) item.put("duration", Long.parseLong(d) / 1000.0);
                mmr.release();
            }
        } catch (Exception ignored) {}
        return item;
    }

    private long queryDateTaken(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { MediaStore.MediaColumns.DATE_TAKEN }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception ignored) {}
        return 0;
    }

    private String queryName(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getString(0);
        } catch (Exception ignored) {}
        return "";
    }

    private File makeThumb(File src, boolean isVideo, String id) {
        try {
            Bitmap bmp;
            Size size = new Size(512, 512);
            if (Build.VERSION.SDK_INT >= 29) {
                bmp = isVideo ? ThumbnailUtils.createVideoThumbnail(src, size, null) : ThumbnailUtils.createImageThumbnail(src, size, null);
            } else if (isVideo) {
                bmp = ThumbnailUtils.createVideoThumbnail(src.getAbsolutePath(), MediaStore.Video.Thumbnails.MINI_KIND);
            } else {
                android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
                o.inJustDecodeBounds = true;
                android.graphics.BitmapFactory.decodeFile(src.getAbsolutePath(), o);
                int s = 1;
                while (Math.max(o.outWidth, o.outHeight) / (s * 2) >= 512) s *= 2;
                o = new android.graphics.BitmapFactory.Options();
                o.inSampleSize = s;
                bmp = android.graphics.BitmapFactory.decodeFile(src.getAbsolutePath(), o);
            }
            if (bmp == null) return null;
            File t = new File(thumbDir(), id + ".jpg");
            try (OutputStream os = new FileOutputStream(t)) {
                bmp.compress(Bitmap.CompressFormat.JPEG, 82, os);
            }
            bmp.recycle();
            return t;
        } catch (Exception e) {
            return null;
        }
    }

    // ---------- Copie de sécurité des métadonnées ----------

    @PluginMethod
    public void writeDb(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json manquant");
            return;
        }
        io.execute(() -> {
            try {
                File dir = new File(getContext().getFilesDir(), "vault");
                dir.mkdirs();
                File tmp = new File(dir, "db.json.tmp");
                try (OutputStream os = new FileOutputStream(tmp)) {
                    os.write(json.getBytes(StandardCharsets.UTF_8));
                }
                File dest = new File(dir, "db.json");
                if (!tmp.renameTo(dest)) throw new Exception("rename failed");
                call.resolve();
            } catch (Exception e) {
                call.reject("Échec de la sauvegarde", e);
            }
        });
    }

    @PluginMethod
    public void readDb(PluginCall call) {
        io.execute(() -> {
            JSObject r = new JSObject();
            File f = new File(getContext().getFilesDir(), "vault/db.json");
            if (f.exists()) {
                try (InputStream in = new FileInputStream(f)) {
                    byte[] b = new byte[(int) f.length()];
                    int off = 0, n;
                    while (off < b.length && (n = in.read(b, off, b.length - off)) > 0) off += n;
                    r.put("json", new String(b, 0, off, StandardCharsets.UTF_8));
                } catch (Exception ignored) {}
            }
            call.resolve(r);
        });
    }

    // ---------- Delete ----------

    @PluginMethod
    public void deleteFiles(PluginCall call) {
        JSArray paths = call.getArray("paths", new JSArray());
        String root = getContext().getFilesDir().getAbsolutePath() + "/vault/";
        io.execute(() -> {
            try {
                for (int i = 0; i < paths.length(); i++) {
                    String p = paths.getString(i);
                    if (p != null && p.startsWith(root)) new File(p).delete();
                }
            } catch (Exception ignored) {}
            call.resolve();
        });
    }

    // ---------- Save to gallery ----------

    @PluginMethod
    public void saveToGallery(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29 && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermCallback");
            return;
        }
        doSave(call);
    }

    @PermissionCallback
    private void storagePermCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) doSave(call);
        else call.reject("Permission refusée", "denied");
    }

    private void doSave(PluginCall call) {
        String path = call.getString("path");
        String mime = call.getString("mime", "image/jpeg");
        if (path == null) {
            call.reject("Chemin manquant");
            return;
        }
        io.execute(() -> {
            try {
                File src = new File(path);
                boolean isVideo = mime.startsWith("video/");
                String name = "Secret_" + System.currentTimeMillis() + "_" + src.getName();
                ContentResolver cr = getContext().getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                Uri collection;
                if (Build.VERSION.SDK_INT >= 29) {
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, (isVideo ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES) + "/Secret");
                    v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    collection = isVideo
                        ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                        : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(isVideo ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES), "Secret");
                    dir.mkdirs();
                    v.put(MediaStore.MediaColumns.DATA, new File(dir, name).getAbsolutePath());
                    collection = isVideo ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                }
                Uri dest = cr.insert(collection, v);
                if (dest == null) throw new Exception("insert failed");
                try (InputStream in = new FileInputStream(src); OutputStream os = cr.openOutputStream(dest)) {
                    byte[] buf = new byte[1 << 16];
                    int n;
                    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                }
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    cr.update(dest, done, null, null);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Échec de l'enregistrement", e);
            }
        });
    }

    // ---------- Biometrics ----------

    @PluginMethod
    public void biometricAvailable(PluginCall call) {
        int r = BiometricManager.from(getContext()).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
        );
        JSObject o = new JSObject();
        o.put("available", r == BiometricManager.BIOMETRIC_SUCCESS);
        call.resolve(o);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                FragmentActivity act = (FragmentActivity) getActivity();
                BiometricPrompt prompt = new BiometricPrompt(act, ContextCompat.getMainExecutor(act), new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                        JSObject o = new JSObject();
                        o.put("success", true);
                        call.resolve(o);
                    }

                    @Override
                    public void onAuthenticationError(int code, CharSequence msg) {
                        JSObject o = new JSObject();
                        o.put("success", false);
                        o.put("code", code);
                        call.resolve(o);
                    }
                });
                BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Déverrouiller Secret")
                    .setNegativeButtonText("Utiliser le code")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                    .build();
                prompt.authenticate(info);
            } catch (Exception e) {
                JSObject o = new JSObject();
                o.put("success", false);
                call.resolve(o);
            }
        });
    }
}
