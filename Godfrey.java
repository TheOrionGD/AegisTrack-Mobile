import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import javax.swing.JOptionPane;

public class Godfrey extends Frame implements ActionListener {

    private static final String API_KEY = "0bef6614413443725df6f1a8c65b8825";

    private final List<String> trackedMobiles = new ArrayList<>();
    private final List<String> lostMobiles = new ArrayList<>();
    private final Random random = new Random();

    private Label label;
    private TextField inputField;
    private TextArea outputArea;

    private Button trackButton;
    private Button reportLostButton;
    private Button displayButton;
    private Button exitButton;

    public Godfrey() {

        setTitle("Mobile Tracking System (Simulation)");
        setSize(600, 450);
        setLayout(new FlowLayout());
        setResizable(false);

        label = new Label("Enter Mobile Number:");
        inputField = new TextField(20);

        trackButton = new Button("Track Mobile Location");
        reportLostButton = new Button("Report Lost Mobile");
        displayButton = new Button("Display Stored Data");
        exitButton = new Button("Exit");

        outputArea = new TextArea(15, 60);
        outputArea.setEditable(false);

        add(label);
        add(inputField);
        add(trackButton);
        add(reportLostButton);
        add(displayButton);
        add(exitButton);
        add(outputArea);

        trackButton.addActionListener(this);
        reportLostButton.addActionListener(this);
        displayButton.addActionListener(this);
        exitButton.addActionListener(this);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                confirmExit();
            }
        });

        setVisible(true);
    }

    @Override
    public void actionPerformed(ActionEvent e) {

        String action = e.getActionCommand();
        String mobileNumber = inputField.getText().trim();

        switch (action) {

            case "Track Mobile Location":
                trackMobile(mobileNumber);
                break;

            case "Report Lost Mobile":
                reportLostMobile(mobileNumber);
                break;

            case "Display Stored Data":
                displayStoredData();
                break;

            case "Exit":
                confirmExit();
                break;
        }
    }

    private void trackMobile(String mobileNumber) {

        if (!isValidMobileNumber(mobileNumber)) {
            outputArea.setText(
                    "Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!validateApiKey(API_KEY)) {
            outputArea.setText(
                    "Authentication failed. Invalid API key.");
            return;
        }

        double latitude = 10 + (random.nextDouble() * 10);
        double longitude = 70 + (random.nextDouble() * 10);

        if (!trackedMobiles.contains(mobileNumber)) {
            trackedMobiles.add(mobileNumber);
        }

        outputArea.setText("=== Mobile Tracking Result ===\n");
        outputArea.append("Mobile Number : " + mobileNumber + "\n");
        outputArea.append(
                String.format("Latitude      : %.4f%n", latitude));
        outputArea.append(
                String.format("Longitude     : %.4f%n", longitude));
        outputArea.append(
                "\nNote: This is a simulated location.");
    }

    private void reportLostMobile(String mobileNumber) {

        if (!isValidMobileNumber(mobileNumber)) {
            outputArea.setText(
                    "Please enter a valid 10-digit mobile number.");
            return;
        }

        if (!lostMobiles.contains(mobileNumber)) {
            lostMobiles.add(mobileNumber);
        }

        outputArea.setText("=== Lost Mobile Report ===\n");
        outputArea.append(
                "Mobile Number : " + mobileNumber + "\n");
        outputArea.append(
                "Status        : Report Registered Successfully\n");
        outputArea.append(
                "Please contact your service provider for assistance.");
    }

    private void displayStoredData() {

        outputArea.setText("===== STORED DATA =====\n\n");

        outputArea.append("Tracked Mobile Numbers\n");
        outputArea.append("----------------------\n");

        if (trackedMobiles.isEmpty()) {
            outputArea.append("No tracked mobile numbers.\n");
        } else {
            for (String number : trackedMobiles) {
                outputArea.append(number + "\n");
            }
        }

        outputArea.append("\nLost Mobile Reports\n");
        outputArea.append("-------------------\n");

        if (lostMobiles.isEmpty()) {
            outputArea.append("No lost mobile reports.\n");
        } else {
            for (String number : lostMobiles) {
                outputArea.append(number + "\n");
            }
        }
    }

    private boolean isValidMobileNumber(String mobileNumber) {
        return mobileNumber.matches("\\d{10}");
    }

    private boolean validateApiKey(String apiKey) {
        return API_KEY.equals(apiKey);
    }

    private void confirmExit() {

        int response = JOptionPane.showConfirmDialog(
                this,
                "Are you sure you want to exit?",
                "Confirm Exit",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.QUESTION_MESSAGE);

        if (response == JOptionPane.YES_OPTION) {
            dispose();
            System.exit(0);
        }
    }

    public static void main(String[] args) {
        new Godfrey();
    }
}
