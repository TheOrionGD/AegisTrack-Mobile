package com.gpstracker;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.*;
import javafx.stage.Stage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;

public class GPSDashboard extends Application {

    private static String BACKEND_URL = "http://localhost:5000";
    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        loadEnv();
    }

    private static void loadEnv() {
        try {
            java.nio.file.Path envPath = java.nio.file.Paths.get("..", "backend", ".env");
            if (java.nio.file.Files.exists(envPath)) {
                java.util.List<String> lines = java.nio.file.Files.readAllLines(envPath);
                String ip = "127.0.0.1";
                for (String line : lines) {
                    if (line.startsWith("SYSTEM_IPV4=")) {
                        ip = line.split("=")[1].trim();
                    }
                }
                BACKEND_URL = "http://" + ip + ":5000";
            }
        } catch (Exception e) {}
    }

    private TextField deviceIdField;
    private TextField tokenField;
    private Label statusLabel;
    private Label connectionStatusLabel;
    private Label latitudeLabel;
    private Label longitudeLabel;
    private Label accuracyLabel;
    private Label timestampLabel;
    private TableView<DeviceLocation> deviceTable;
    private ObservableList<DeviceLocation> deviceList;
    private ListView<String> registeredDevicesListView;
    private ObservableList<String> registeredIdsList;
    private WebSocket webSocket;
    private String currentDeviceId = "";

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("MTS // TACTICAL MONITOR");
        
        BorderPane root = new BorderPane();
        root.getStyleClass().add("root");
        
        // SIDEBAR
        VBox sidebar = createSidebar();
        root.setLeft(sidebar);
        
        // MAIN CONTENT
        VBox mainContent = createMainContent();
        root.setCenter(mainContent);
        
        Scene scene = new Scene(root, 1000, 700);
        
        // Apply CSS
        try {
            String cssPath = new java.io.File("style.css").toURI().toURL().toExternalForm();
            scene.getStylesheets().add(cssPath);
        } catch (Exception e) {
            System.err.println("Could not load CSS: " + e.getMessage());
        }
        
        primaryStage.setScene(scene);
        primaryStage.setOnCloseRequest(e -> {
            if (webSocket != null) {
                webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "shutting down");
            }
        });
        primaryStage.show();
    }

    private VBox createSidebar() {
        VBox sidebar = new VBox(20);
        sidebar.setPadding(new Insets(20));
        sidebar.setPrefWidth(220);
        sidebar.setStyle("-fx-background-color: #0d121c; -fx-border-color: rgba(0, 242, 255, 0.1); -fx-border-width: 0 1 0 0;");
        
        Label logo = new Label("MTS CORE");
        logo.setStyle("-fx-text-fill: #00f2ff; -fx-font-size: 18px; -fx-font-weight: bold;");
        
        Label registryTitle = new Label("HARDWARE REGISTRY");
        registryTitle.getStyleClass().add("panel-title");
        
        registeredIdsList = FXCollections.observableArrayList();
        registeredDevicesListView = new ListView<>(registeredIdsList);
        registeredDevicesListView.setPrefHeight(400);
        registeredDevicesListView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                deviceIdField.setText(newVal);
                fetchDeviceLocation();
            }
        });
        
        Button refreshBtn = new Button("REFRESH REGISTRY");
        refreshBtn.setMaxWidth(Double.MAX_VALUE);
        refreshBtn.setOnAction(e -> refreshAllDevices());
        
        connectionStatusLabel = new Label("WS: Disconnected");
        connectionStatusLabel.setStyle("-fx-text-fill: #7a8a99; -fx-font-size: 10px;");
        
        sidebar.getChildren().addAll(logo, registryTitle, registeredDevicesListView, refreshBtn, connectionStatusLabel);
        return sidebar;
    }

    private VBox createMainContent() {
        VBox container = new VBox(20);
        container.setPadding(new Insets(25));
        
        // TOP ACCESS PANEL
        HBox authPanel = new HBox(15);
        authPanel.setPadding(new Insets(15));
        authPanel.getStyleClass().add("cyber-panel");
        authPanel.setAlignment(Pos.CENTER_LEFT);
        
        VBox tokenBox = new VBox(5);
        tokenBox.getChildren().addAll(new Label("ACCESS TOKEN"), tokenField = new TextField());
        tokenField.setPromptText("Paste JWT Token here...");
        tokenField.setPrefWidth(300);
        
        VBox idBox = new VBox(5);
        idBox.getChildren().addAll(new Label("TARGET NODE"), deviceIdField = new TextField());
        deviceIdField.setPromptText("Device ID");
        
        Button connectBtn = new Button("INITIATE LINK");
        connectBtn.setPrefHeight(45);
        connectBtn.setOnAction(e -> connectWebSocket());
        
        authPanel.getChildren().addAll(tokenBox, idBox, connectBtn);
        
        // TELEMETRY DISPLAY
        GridPane telemetryPanel = new GridPane();
        telemetryPanel.setHgap(20);
        telemetryPanel.setVgap(15);
        telemetryPanel.setPadding(new Insets(20));
        telemetryPanel.getStyleClass().add("cyber-panel");
        
        latitudeLabel = new Label("LATITUDE: --");
        longitudeLabel = new Label("LONGITUDE: --");
        accuracyLabel = new Label("ACCURACY: --");
        timestampLabel = new Label("SYNC: --");
        statusLabel = new Label("STATUS: IDLE");
        
        telemetryPanel.add(new Label("REAL-TIME SENSORS"), 0, 0, 2, 1);
        telemetryPanel.add(latitudeLabel, 0, 1);
        telemetryPanel.add(longitudeLabel, 1, 1);
        telemetryPanel.add(accuracyLabel, 0, 2);
        telemetryPanel.add(timestampLabel, 1, 2);
        telemetryPanel.add(statusLabel, 0, 3, 2, 1);
        
        // GLOBAL MANIFEST (TABLE)
        VBox tableContainer = new VBox(10);
        tableContainer.getStyleClass().add("cyber-panel");
        tableContainer.setPadding(new Insets(15));
        
        Label tableTitle = new Label("GLOBAL MANIFEST");
        tableTitle.getStyleClass().add("panel-title");
        
        deviceList = FXCollections.observableArrayList();
        deviceTable = new TableView<>(deviceList);
        
        TableColumn<DeviceLocation, String> idCol = new TableColumn<>("NODE_ID");
        idCol.setCellValueFactory(new PropertyValueFactory<>("deviceId"));
        
        TableColumn<DeviceLocation, Double> latCol = new TableColumn<>("LAT");
        latCol.setCellValueFactory(new PropertyValueFactory<>("latitude"));
        
        TableColumn<DeviceLocation, Double> lngCol = new TableColumn<>("LNG");
        lngCol.setCellValueFactory(new PropertyValueFactory<>("longitude"));
        
        TableColumn<DeviceLocation, String> timeCol = new TableColumn<>("TIMESTAMP");
        timeCol.setCellValueFactory(new PropertyValueFactory<>("timestamp"));
        
        deviceTable.getColumns().add(idCol);
        deviceTable.getColumns().add(latCol);
        deviceTable.getColumns().add(lngCol);
        deviceTable.getColumns().add(timeCol);
        deviceTable.setPrefHeight(300);
        
        Button mapsBtn = new Button("OPEN IN COMMAND MAP");
        mapsBtn.getStyleClass().add("button-outline");
        mapsBtn.setOnAction(e -> openInGoogleMaps());
        
        tableContainer.getChildren().addAll(tableTitle, deviceTable, mapsBtn);
        
        container.getChildren().addAll(authPanel, telemetryPanel, tableContainer);
        return container;
    }

    private void refreshAllDevices() {
        if (isUnauthenticated()) return;
        new Thread(() -> {
            try {
                HttpRequest request = requestBuilder(BACKEND_URL + "/devices").GET().build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    ObservableList<DeviceLocation> newItems = FXCollections.observableArrayList();
                    ObservableList<String> newIds = FXCollections.observableArrayList();
                    
                    if (root.isArray()) {
                        for (JsonNode node : root) {
                            String id = node.path("device_id").asText();
                            double lat = node.path("last_latitude").asDouble();
                            double lng = node.path("last_longitude").asDouble();
                            double acc = node.path("last_accuracy").asDouble();
                            String ts = node.path("last_sync").asText();
                            
                            newItems.add(new DeviceLocation(id, lat, lng, acc, ts));
                            newIds.add(id);
                        }
                    }
                    
                    Platform.runLater(() -> {
                        deviceList.setAll(newItems);
                        registeredIdsList.setAll(newIds);
                        statusLabel.setText("STATUS: Manifest Updated");
                    });
                } else if (response.statusCode() == 401) {
                    Platform.runLater(() -> showAlert("Auth Error", "Session expired or invalid token."));
                }
            } catch (Exception e) {
                System.err.println("Refresh failed: " + e.getMessage());
            }
        }).start();
    }

    private void fetchDeviceLocation() {
        if (isUnauthenticated()) return;
        String id = deviceIdField.getText().trim();
        if (id.isEmpty()) return;
        
        new Thread(() -> {
            try {
                HttpRequest request = requestBuilder(BACKEND_URL + "/location/" + id).GET().build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() == 200) {
                    JsonNode node = objectMapper.readTree(response.body());
                    Platform.runLater(() -> {
                        latitudeLabel.setText("LATITUDE: " + node.path("latitude").asDouble());
                        longitudeLabel.setText("LONGITUDE: " + node.path("longitude").asDouble());
                        accuracyLabel.setText("ACCURACY: " + node.path("accuracy").asDouble() + "M");
                        timestampLabel.setText("SYNC: " + node.path("timestamp").asText());
                        statusLabel.setText("STATUS: Point Lock Acquired");
                        currentDeviceId = id;
                    });
                }
            } catch (Exception e) {}
        }).start();
    }

    private void connectWebSocket() {
        if (isUnauthenticated()) return;
        String token = tokenField.getText().trim();

        String wsUrl = BACKEND_URL.replace("http", "ws") + "/ws?token=" + token;
        httpClient.newWebSocketBuilder()
                .buildAsync(URI.create(wsUrl), new WebSocket.Listener() {
                    StringBuilder buffer = new StringBuilder();

                    @Override
                    public void onOpen(WebSocket ws) {
                        GPSDashboard.this.webSocket = ws;
                        ws.request(1);
                        Platform.runLater(() -> connectionStatusLabel.setText("WS: LINK_ACTIVE"));
                    }

                    @Override
                    public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
                        buffer.append(data);
                        if (last) {
                            handleWS(buffer.toString());
                            buffer.setLength(0);
                        }
                        ws.request(1);
                        return null;
                    }
                });
    }

    private boolean isUnauthenticated() {
        String token = tokenField.getText().trim();
        if (token.isEmpty()) {
            showAlert("DENIED", "AUTHENTICATION_REQUIRED. Please paste your session token.");
            return true;
        }
        return false;
    }

    private void handleWS(String text) {
        try {
            JsonNode msg = objectMapper.readTree(text);
            if ("location_updated".equals(msg.path("event").asText())) {
                JsonNode p = msg.path("payload");
                if (p.path("device_id").asText().equals(currentDeviceId)) {
                    Platform.runLater(() -> {
                        latitudeLabel.setText("LATITUDE: " + p.path("latitude").asDouble());
                        longitudeLabel.setText("LONGITUDE: " + p.path("longitude").asDouble());
                        accuracyLabel.setText("ACCURACY: " + p.path("accuracy").asDouble() + "M");
                        timestampLabel.setText("SYNC: " + p.path("timestamp").asText());
                        statusLabel.setText("STATUS: LIVE_UPDATE");
                    });
                }
            }
        } catch (Exception e) {}
    }

    private void openInGoogleMaps() {
        DeviceLocation sel = deviceTable.getSelectionModel().getSelectedItem();
        if (sel != null) {
            String url = String.format("https://www.google.com/maps/search/?api=1&query=%f,%f", sel.getLatitude(), sel.getLongitude());
            try {
                java.awt.Desktop.getDesktop().browse(java.net.URI.create(url));
            } catch (Exception e) {}
        }
    }

    private HttpRequest.Builder requestBuilder(String url) {
        HttpRequest.Builder b = HttpRequest.newBuilder().uri(URI.create(url));
        String t = tokenField.getText().trim();
        if (!t.isEmpty()) b.header("Authorization", "Bearer " + t);
        return b;
    }

    private void showAlert(String t, String m) {
        Platform.runLater(() -> {
            Alert a = new Alert(Alert.AlertType.INFORMATION);
            a.setTitle(t);
            a.setHeaderText(null);
            a.setContentText(m);
            a.showAndWait();
        });
    }

    public static class DeviceLocation {
        private final String deviceId;
        private final double latitude;
        private final double longitude;
        private final double accuracy;
        private final String timestamp;

        public DeviceLocation(String id, double lat, double lng, double acc, String ts) {
            this.deviceId = id; this.latitude = lat; this.longitude = lng;
            this.accuracy = acc; this.timestamp = ts;
        }
        public String getDeviceId() { return deviceId; }
        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }
        public double getAccuracy() { return accuracy; }
        public String getTimestamp() { return timestamp; }
    }
}
