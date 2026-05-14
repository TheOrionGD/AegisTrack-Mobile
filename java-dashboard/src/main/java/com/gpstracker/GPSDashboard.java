package com.gpstracker;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class GPSDashboard extends Application {

    private static final String BACKEND_URL = "http://10.171.58.245:5000";
    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private TextField deviceIdField;
    private TextField tokenField;
    private Button fetchButton;
    private Button connectWsButton;
    private Button mapsButton;
    private Label statusLabel;
    private Label connectionStatusLabel;
    private Label latitudeLabel;
    private Label longitudeLabel;
    private Label accuracyLabel;
    private Label timestampLabel;
    private TableView<DeviceLocation> deviceTable;
    private ObservableList<DeviceLocation> deviceList;
    private WebSocket webSocket;
    private String currentDeviceId = "";
    private java.util.Timer refreshTimer;

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("GPS Tracking Dashboard");
        createUI(primaryStage);
        startAutoRefresh();
        primaryStage.setOnCloseRequest(e -> {
            if (refreshTimer != null) {
                refreshTimer.cancel();
            }
            if (webSocket != null) {
                webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "shutting down");
            }
        });
        primaryStage.show();
    }

    private void createUI(Stage stage) {
        BorderPane mainLayout = new BorderPane();
        mainLayout.setPadding(new Insets(10));

        HBox topBox = new HBox(10);
        topBox.setPadding(new Insets(10));
        topBox.setStyle("-fx-background-color: #f0f0f0;");

        Label deviceLabel = new Label("Device ID/Phone:");
        deviceIdField = new TextField();
        deviceIdField.setPromptText("Enter device ID or phone number");
        fetchButton = new Button("Fetch Location");
        mapsButton = new Button("Open in Maps");
        mapsButton.setDisable(true);

        fetchButton.setOnAction(e -> fetchDeviceLocation());
        mapsButton.setOnAction(e -> openInGoogleMaps());

        topBox.getChildren().addAll(deviceLabel, deviceIdField, fetchButton, mapsButton);

        HBox tokenBox = new HBox(10);
        tokenBox.setPadding(new Insets(10));
        tokenBox.setStyle("-fx-background-color: #f9f9f9;");

        Label tokenLabel = new Label("Access Token:");
        tokenField = new TextField();
        tokenField.setPromptText("Paste JWT token here");
        connectWsButton = new Button("Connect Live");
        connectionStatusLabel = new Label("WebSocket: disconnected");

        connectWsButton.setOnAction(e -> startWebSocket());
        tokenBox.getChildren().addAll(tokenLabel, tokenField, connectWsButton, connectionStatusLabel);

        VBox topContainer = new VBox(10);
        topContainer.getChildren().addAll(topBox, tokenBox);

        VBox centerBox = new VBox(10);
        centerBox.setPadding(new Insets(10));

        Label currentTitle = new Label("Current Device Location");
        currentTitle.setStyle("-fx-font-size: 16px; -fx-font-weight: bold;");

        statusLabel = new Label("Status: Not connected");
        latitudeLabel = new Label("Latitude: --");
        longitudeLabel = new Label("Longitude: --");
        accuracyLabel = new Label("Accuracy: -- meters");
        timestampLabel = new Label("Last Updated: --");

        centerBox.getChildren().addAll(currentTitle, statusLabel, latitudeLabel,
                                     longitudeLabel, accuracyLabel, timestampLabel);

        VBox bottomBox = new VBox(10);
        bottomBox.setPadding(new Insets(10));

        Label tableTitle = new Label("All Tracked Devices");
        tableTitle.setStyle("-fx-font-size: 16px; -fx-font-weight: bold;");

        deviceTable = new TableView<>();
        deviceList = FXCollections.observableArrayList();

        TableColumn<DeviceLocation, String> deviceCol = new TableColumn<>("Device ID");
        deviceCol.setCellValueFactory(new PropertyValueFactory<>("deviceId"));
        deviceCol.setPrefWidth(120);

        TableColumn<DeviceLocation, Double> latCol = new TableColumn<>("Latitude");
        latCol.setCellValueFactory(new PropertyValueFactory<>("latitude"));
        latCol.setPrefWidth(100);

        TableColumn<DeviceLocation, Double> lngCol = new TableColumn<>("Longitude");
        lngCol.setCellValueFactory(new PropertyValueFactory<>("longitude"));
        lngCol.setPrefWidth(100);

        TableColumn<DeviceLocation, Double> accCol = new TableColumn<>("Accuracy");
        accCol.setCellValueFactory(new PropertyValueFactory<>("accuracy"));
        accCol.setPrefWidth(80);

        TableColumn<DeviceLocation, String> timeCol = new TableColumn<>("Last Updated");
        timeCol.setCellValueFactory(new PropertyValueFactory<>("timestamp"));
        timeCol.setPrefWidth(150);

        deviceTable.getColumns().add(deviceCol);
        deviceTable.getColumns().add(latCol);
        deviceTable.getColumns().add(lngCol);
        deviceTable.getColumns().add(accCol);
        deviceTable.getColumns().add(timeCol);
        deviceTable.setItems(deviceList);
        deviceTable.setPrefHeight(200);

        bottomBox.getChildren().addAll(tableTitle, deviceTable);

        mainLayout.setTop(topContainer);
        mainLayout.setCenter(centerBox);
        mainLayout.setBottom(bottomBox);

        Scene scene = new Scene(mainLayout, 900, 620);
        stage.setScene(scene);
    }

    private HttpRequest.Builder requestBuilder(String url) {
        HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(url));
        String token = tokenField.getText().trim();
        if (!token.isEmpty()) {
            builder.header("Authorization", "Bearer " + token);
        }
        return builder;
    }

    private void fetchDeviceLocation() {
        currentDeviceId = deviceIdField.getText().trim();
        if (currentDeviceId.isEmpty()) {
            showAlert("Error", "Please enter a device ID or phone number.");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                HttpRequest request = requestBuilder(BACKEND_URL + "/location/" + currentDeviceId)
                        .GET().build();

                HttpResponse<String> response = httpClient.send(request,
                        HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode locationData = objectMapper.readTree(response.body());
                    Platform.runLater(() -> {
                        latitudeLabel.setText("Latitude: " + locationData.get("latitude").asDouble());
                        longitudeLabel.setText("Longitude: " + locationData.get("longitude").asDouble());
                        accuracyLabel.setText("Accuracy: " + locationData.get("accuracy").asDouble() + " meters");
                        timestampLabel.setText("Last Updated: " + locationData.get("timestamp").asText());
                        statusLabel.setText("Status: Connected");
                        mapsButton.setDisable(false);
                    });
                } else {
                    JsonNode errorBody = objectMapper.readTree(response.body());
                    Platform.runLater(() -> {
                        statusLabel.setText("Status: " + errorBody.path("error").asText("Device not found"));
                        mapsButton.setDisable(true);
                    });
                }
            } catch (IOException | InterruptedException e) {
                Platform.runLater(() -> {
                    statusLabel.setText("Status: Connection failed - " + e.getMessage());
                    mapsButton.setDisable(true);
                });
            }
        });
    }

    private void refreshAllDevices() {
        CompletableFuture.runAsync(() -> {
            try {
                HttpRequest request = requestBuilder(BACKEND_URL + "/devices")
                        .GET().build();

                HttpResponse<String> response = httpClient.send(request,
                        HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode data = objectMapper.readTree(response.body());
                    JsonNode devicesJson = data.get("devices");

                    Platform.runLater(() -> {
                        deviceList.clear();
                        for (JsonNode device : devicesJson) {
                            deviceList.add(new DeviceLocation(
                                device.get("device_id").asText(),
                                device.get("latitude").asDouble(),
                                device.get("longitude").asDouble(),
                                device.get("accuracy").asDouble(),
                                device.get("timestamp").asText()
                            ));
                        }
                    });
                }
            } catch (IOException | InterruptedException e) {
                System.out.println("Failed to refresh devices: " + e.getMessage());
            }
        });
    }

    private void openInGoogleMaps() {
        String latText = latitudeLabel.getText().replace("Latitude: ", "");
        String lngText = longitudeLabel.getText().replace("Longitude: ", "");

        if (!latText.equals("--") && !lngText.equals("--")) {
            try {
                double lat = Double.parseDouble(latText);
                double lng = Double.parseDouble(lngText);
                String url = "https://maps.google.com/?q=" + lat + "," + lng;
                java.awt.Desktop.getDesktop().browse(URI.create(url));
            } catch (IOException | IllegalArgumentException e) {
                showAlert("Error", "Failed to open Google Maps: " + e.getMessage());
            }
        }
    }

    private void startWebSocket() {
        String token = tokenField.getText().trim();
        if (token.isEmpty()) {
            showAlert("Authentication", "Please enter an access token.");
            return;
        }

        if (webSocket != null) {
            webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "reconnect");
        }

        String wsUrl = BACKEND_URL.replaceFirst("^http", "ws") + "/ws?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        httpClient.newWebSocketBuilder()
                .buildAsync(URI.create(wsUrl), new WebSocket.Listener() {
                    private final StringBuilder buffer = new StringBuilder();

                    @Override
                    public void onOpen(WebSocket webSocket) {
                        GPSDashboard.this.webSocket = webSocket;
                        webSocket.request(1);
                        Platform.runLater(() -> connectionStatusLabel.setText("WebSocket connected"));
                    }

                    @Override
                    public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                        buffer.append(data);
                        if (last) {
                            handleWebSocketMessage(buffer.toString());
                            buffer.setLength(0);
                        }
                        webSocket.request(1);
                        return CompletableFuture.completedFuture(null);
                    }

                    @Override
                    public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                        Platform.runLater(() -> connectionStatusLabel.setText("WebSocket disconnected"));
                        return CompletableFuture.completedFuture(null);
                    }

                    @Override
                    public void onError(WebSocket webSocket, Throwable error) {
                        Platform.runLater(() -> connectionStatusLabel.setText("WebSocket error"));
                    }
                })
                .exceptionally(ex -> {
                    Platform.runLater(() -> connectionStatusLabel.setText("WebSocket failed: " + ex.getMessage()));
                    return null;
                });
    }

    private void handleWebSocketMessage(String text) {
        try {
            JsonNode message = objectMapper.readTree(text);
            String event = message.path("event").asText();
            JsonNode payload = message.path("payload");

            if ("location_updated".equals(event)) {
                Platform.runLater(() -> {
                    String deviceId = payload.path("device_id").asText();
                    if (deviceId.equals(currentDeviceId)) {
                        latitudeLabel.setText("Latitude: " + payload.path("latitude").asDouble());
                        longitudeLabel.setText("Longitude: " + payload.path("longitude").asDouble());
                        accuracyLabel.setText("Accuracy: " + payload.path("accuracy").asDouble() + " meters");
                        timestampLabel.setText("Last Updated: " + payload.path("timestamp").asText());
                        statusLabel.setText("Status: Live update received");
                        mapsButton.setDisable(false);
                    }
                });
            }

            if ("geofence_alert".equals(event)) {
                Platform.runLater(() -> {
                    showAlert("Geofence Alert", payload.path("message").asText("Device left the configured geofence."));
                });
            }
        } catch (IOException e) {
            System.out.println("Invalid WebSocket message: " + e.getMessage());
        }
    }

    private void startAutoRefresh() {
        refreshTimer = new java.util.Timer(true);
        refreshTimer.scheduleAtFixedRate(new java.util.TimerTask() {
            @Override
            public void run() {
                refreshAllDevices();
            }
        }, 0, 5000);
    }

    private void showAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    public static class DeviceLocation {
        private final String deviceId;
        private final double latitude;
        private final double longitude;
        private final double accuracy;
        private final String timestamp;

        public DeviceLocation(String deviceId, double latitude, double longitude,
                            double accuracy, String timestamp) {
            this.deviceId = deviceId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.accuracy = accuracy;
            this.timestamp = timestamp;
        }

        public String getDeviceId() { return deviceId; }
        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }
        public double getAccuracy() { return accuracy; }
        public String getTimestamp() { return timestamp; }
    }
}
