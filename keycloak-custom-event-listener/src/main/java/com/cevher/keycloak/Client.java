package com.cevher.keycloak;

import okhttp3.*;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.IOException;
import org.jboss.logging.Logger;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;


public class Client {

    private static final String WEBHOOK_URL = "http://node-server:3001/keycloak-events";
    private static final OkHttpClient client = new OkHttpClient();
    private static final Logger log = Logger.getLogger(Client.class);

    public static void postService(String data) {
        
        RequestBody body = RequestBody.create(data, MediaType.get("application/json; charset=utf-8"));
        log.debug("Sending data to webhook: " + data);

        Request request = new Request.Builder()
                .url(WEBHOOK_URL)
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }

            // For debugging, you can log the response
            System.out.println("Response: " + response.body().string());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
