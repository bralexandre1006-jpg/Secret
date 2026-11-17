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
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
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
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.util.Locale;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
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
    private ActivityResultLauncher<IntentSenderRequest> deleteLauncher;
    private PluginCall pendingDelete;

    @Override
    public void load() {
        super.load();
        deleteLauncher = getActivity().getActivityResultRegistry().register(
            "secret-gallery-delete",
            new ActivityResultContracts.StartIntentSenderForResult(),
            result -> {
                PluginCall c = pendingDelete;
                pendingDelete = null;
                if (c == null) return;
                JSObject o = new JSObject();
                o.put("deleted", result.getResultCode() == Activity.RESULT_OK);
                c.resolve(o);
            }
        );
    }

    // ---------- Suppression des originaux dans la galerie du téléphone ----------

    private Uri toMediaStoreUri(Uri uri, String mime) {
        try {
            String auth = uri.getAuthority();
            if (MediaStore.AUTHORITY.equals(auth)) {
                List<String> seg = uri.getPathSegments();
                if (seg.contains("picker") || seg.contains("picker_get_content")) {
                    long id = Long.parseLong(uri.getLastPathSegment());
                    Uri base = mime.startsWith("video/")
                        ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                        : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
                    return android.content.ContentUris.withAppendedId(base, id);
                }
                return uri;
            }
            if (Build.VERSION.SDK_INT >= 29 && "com.android.providers.media.documents".equals(auth)) {
                return MediaStore.getMediaUri(getContext(), uri);
            }
        } catch (Exception ignored) {}
        return null;
    }

    @PluginMethod
    public void canDeleteFromGallery(PluginCall call) {
        JSObject o = new JSObject();
        o.put("available", Build.VERSION.SDK_INT >= 30);
        call.resolve(o);
    }

    @PluginMethod
    public void deleteFromGallery(PluginCall call) {
        if (Build.VERSION.SDK_INT < 30) {
            call.reject("Android 11 minimum", "unsupported");
            return;
        }
        JSArray arr = call.getArray("uris", new JSArray());
        List<Uri> uris = new ArrayList<>();
        try {
            for (int i = 0; i < arr.length(); i++) uris.add(Uri.parse(arr.getString(i)));
        } catch (Exception ignored) {}
        if (uris.isEmpty()) {
            JSObject o = new JSObject();
            o.put("deleted", false);
            call.resolve(o);
            return;
        }
        try {
            android.app.PendingIntent pi = MediaStore.createDeleteRequest(getContext().getContentResolver(), uris);
            pendingDelete = call;
            deleteLauncher.launch(new IntentSenderRequest.Builder(pi.getIntentSender()).build());
        } catch (Exception e) {
            pendingDelete = null;
            call.reject("Suppression impossible", e);
        }
    }

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
                    if (item != null) {
                        Uri src = toMediaStoreUri(uri, item.getString("mime", ""));
                        if (src != null) item.put("source", src.toString());
                        items.put(item);
                    }
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

        return finishItem(out, id, mime, queryName(uri), queryDateTaken(uri));
    }

    private JSObject finishItem(File out, String id, String mime, String name, long taken) {
        boolean isVideo = mime.startsWith("video/");
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
        if (!isVideo) {
            File prev = makePreview(out, id);
            if (prev != null) item.put("preview", prev.getAbsolutePath());
        }

        if (isVideo) {
            try {
                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                mmr.setDataSource(out.getAbsolutePath());
                String d = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                if (d != null) item.put("duration", Long.parseLong(d) / 1000.0);
                mmr.release();
            } catch (Exception ignored) {}
        }
        return item;
    }

    // ---------- ZIP : import ----------

    @PluginMethod
    public void importZip(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/zip", "application/x-zip-compressed", "application/octet-stream" });
        startActivityForResult(call, intent, "zipPickResult");
    }

    @ActivityCallback
    private void zipPickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject r = new JSObject();
            r.put("items", new JSArray());
            call.resolve(r);
            return;
        }
        Uri uri = data.getData();
        io.execute(() -> {
            JSArray items0 = new JSArray();
            String zipName = queryName(uri).replaceAll("(?i)\\.zip$", "");
            try {
                readZip(uri, StandardCharsets.UTF_8, items0);
            } catch (Exception ex) {
                deleteItems(items0);
                items0 = new JSArray();
                try {
                    readZip(uri, java.nio.charset.Charset.forName("Cp437"), items0);
                } catch (Exception ex2) {
                    deleteItems(items0);
                    call.reject("ZIP illisible", ex2);
                    return;
                }
            }
            JSObject r = new JSObject();
            r.put("items", items0);
            r.put("zipName", zipName);
            call.resolve(r);
        });
    }

    private void readZip(Uri uri, java.nio.charset.Charset cs, JSArray items) throws Exception {
        try (InputStream raw = getContext().getContentResolver().openInputStream(uri);
             ZipInputStream zin = new ZipInputStream(new BufferedInputStream(raw), cs)) {
            ZipEntry e;
            int done = 0;
            byte[] buf = new byte[1 << 16];
            while ((e = zin.getNextEntry()) != null) {
                if (e.isDirectory()) continue;
                String entry = e.getName().replace('\\', '/');
                if (entry.startsWith("__MACOSX/") || entry.contains("/.") || entry.startsWith(".")) continue;
                String base = entry.substring(entry.lastIndexOf('/') + 1);
                int dot = base.lastIndexOf('.');
                if (dot < 0) continue;
                String ext = base.substring(dot + 1).toLowerCase(Locale.ROOT);
                String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                if (mime == null && ext.equals("heic")) mime = "image/heic";
                if (mime == null || !(mime.startsWith("image/") || mime.startsWith("video/"))) continue;
                String id = UUID.randomUUID().toString();
                File out = new File(mediaDir(), id + "." + ext);
                try (OutputStream os = new FileOutputStream(out)) {
                    int n;
                    while ((n = zin.read(buf)) > 0) os.write(buf, 0, n);
                }
                long t = e.getTime();
                JSObject item = finishItem(out, id, mime, base, t > 0 ? t : 0);
                int slash = entry.lastIndexOf('/');
                String folder = slash > 0 ? entry.substring(0, slash) : "";
                folder = folder.contains("/") ? folder.substring(folder.lastIndexOf('/') + 1) : folder;
                item.put("folder", folder);
                items.put(item);
                done++;
                JSObject p = new JSObject();
                p.put("done", done);
                notifyListeners("zipProgress", p);
            }
        }
    }

    private void deleteItems(JSArray items) {
        for (int i = 0; i < items.length(); i++) {
            try {
                org.json.JSONObject o = items.getJSONObject(i);
                new File(o.getString("path")).delete();
                if (o.has("thumb")) new File(o.getString("thumb")).delete();
            } catch (Exception ignored) {}
        }
    }

    // ---------- ZIP : export ----------

    @PluginMethod
    public void exportZip(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29 && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "exportPermCallback");
            return;
        }
        doExport(call);
    }

    @PermissionCallback
    private void exportPermCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) doExport(call);
        else call.reject("Permission refusée", "denied");
    }

    private void doExport(PluginCall call) {
        String name = call.getString("name", "Secret").replaceAll("[\\\\/:*?\"<>|]", "_") + ".zip";
        JSArray entries = call.getArray("entries", new JSArray());
        io.execute(() -> {
            Uri dest = null;
            try {
                ContentResolver cr = getContext().getContentResolver();
                OutputStream raw;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, "application/zip");
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Secret");
                    v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    dest = cr.insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), v);
                    if (dest == null) throw new Exception("insert failed");
                    raw = cr.openOutputStream(dest);
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Secret");
                    dir.mkdirs();
                    raw = new FileOutputStream(new File(dir, name));
                }
                byte[] buf = new byte[1 << 16];
                try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(raw))) {
                    zos.setLevel(Deflater.NO_COMPRESSION);
                    java.util.HashSet<String> used = new java.util.HashSet<>();
                    for (int i = 0; i < entries.length(); i++) {
                        JSObject en = JSObject.fromJSONObject(entries.getJSONObject(i));
                        File src = new File(en.getString("path", ""));
                        if (!src.exists()) continue;
                        String entryName = en.getString("name", src.getName());
                        String unique = entryName;
                        int k = 1;
                        while (!used.add(unique.toLowerCase(Locale.ROOT))) {
                            int dot = entryName.lastIndexOf('.');
                            unique = dot > 0 ? entryName.substring(0, dot) + " (" + k + ")" + entryName.substring(dot) : entryName + " (" + k + ")";
                            k++;
                        }
                        ZipEntry ze = new ZipEntry(unique);
                        long t = en.has("time") ? en.getLong("time") : 0;
                        if (t > 0) ze.setTime(t);
                        zos.putNextEntry(ze);
                        try (InputStream in = new FileInputStream(src)) {
                            int n;
                            while ((n = in.read(buf)) > 0) zos.write(buf, 0, n);
                        }
                        zos.closeEntry();
                        JSObject p = new JSObject();
                        p.put("done", i + 1);
                        p.put("total", entries.length());
                        notifyListeners("zipProgress", p);
                    }
                }
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    cr.update(dest, done, null, null);
                }
                JSObject r = new JSObject();
                r.put("name", name);
                call.resolve(r);
            } catch (Exception e) {
                if (dest != null) try { getContext().getContentResolver().delete(dest, null, null); } catch (Exception ignored) {}
                call.reject("Échec de l'export", e);
            }
        });
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

    // Version écran (2560 px max) : affichage fluide dans la visionneuse
    private File makePreview(File src, String id) {
        try {
            android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            android.graphics.BitmapFactory.decodeFile(src.getAbsolutePath(), o);
            int max = Math.max(o.outWidth, o.outHeight);
            if (max <= 0) return null;
            File d = new File(getContext().getFilesDir(), "vault/previews");
            d.mkdirs();
            File t = new File(d, id + ".jpg");
            if (t.exists()) return t;
            if (max <= 2560 && !"image/heic".equals(o.outMimeType) && !"image/heif".equals(o.outMimeType)) return null;
            int sample = 1;
            while (max / (sample * 2) >= 2560) sample *= 2;
            android.graphics.BitmapFactory.Options o2 = new android.graphics.BitmapFactory.Options();
            o2.inSampleSize = sample;
            Bitmap bmp = android.graphics.BitmapFactory.decodeFile(src.getAbsolutePath(), o2);
            if (bmp == null) return null;
            float scale = 2560f / Math.max(bmp.getWidth(), bmp.getHeight());
            int rot = 0;
            try {
                androidx.exifinterface.media.ExifInterface ex = new androidx.exifinterface.media.ExifInterface(src.getAbsolutePath());
                rot = ex.getRotationDegrees();
            } catch (Exception ignored) {}
            android.graphics.Matrix m = new android.graphics.Matrix();
            if (scale < 1f) m.postScale(scale, scale);
            if (rot != 0) m.postRotate(rot);
            Bitmap out = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
            try (OutputStream os = new FileOutputStream(t)) {
                out.compress(Bitmap.CompressFormat.JPEG, 88, os);
            }
            if (out != bmp) out.recycle();
            bmp.recycle();
            return t;
        } catch (Throwable e) {
            return null;
        }
    }

    @PluginMethod
    public void ensurePreviews(PluginCall call) {
        JSArray arr = call.getArray("items", new JSArray());
        io.execute(() -> {
            JSObject res = new JSObject();
            for (int i = 0; i < arr.length(); i++) {
                try {
                    org.json.JSONObject o = arr.getJSONObject(i);
                    File src = new File(o.getString("path"));
                    if (!src.exists()) continue;
                    File p = makePreview(src, o.getString("id"));
                    res.put(o.getString("id"), p != null ? p.getAbsolutePath() : "");
                } catch (Exception ignored) {}
            }
            JSObject r = new JSObject();
            r.put("previews", res);
            call.resolve(r);
        });
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
