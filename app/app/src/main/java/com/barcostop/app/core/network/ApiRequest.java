package com.barcostop.app.core.network;

import java.util.HashMap;
import java.util.Map;

public class ApiRequest {
    public String method;
    public String path;
    public String jsonBody;
    public Map<String, String> headers = new HashMap<>();

    public ApiRequest(String method, String path) {
        this.method = method;
        this.path = path;
    }
}
