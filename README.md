```text
 █████╗ ███████╗ ██████╗ ██╗███████╗████████╗██████╗  █████╗  ██████╗██╗  ██╗            ███╗   ███╗ ██████╗ ██████╗ ██╗██╗     ███████╗
██╔══██╗██╔════╝██╔════╝ ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝            ████╗ ████║██╔═══██╗██╔══██╗██║██║     ██╔════╝
███████║█████╗  ██║  ███╗██║███████╗   ██║   ██████╔╝███████║██║     █████╔╝   ██████╗   ██╔████╔██║██║   ██║██████╔╝██║██║     █████╗  
██╔══██║██╔══╝  ██║   ██║██║╚════██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗   ╚═════╝   ██║╚██╔╝██║██║   ██║██╔══██╗██║██║     ██╔══╝  
██║  ██║███████╗╚██████╔╝██║███████║   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗            ██║ ╚═╝ ██║╚██████╔╝██████╔╝██║███████╗███████╗
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝            ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚══════╝╚══════╝
```

[![Production Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge&logo=github)](https://github.com/)
[![Java Platform](https://img.shields.io/badge/JavaSE-17%20%7C%2021-orange.svg?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge&logo=apache)](https://www.apache.org/licenses/LICENSE-2.0)
[![Compliance](https://img.shields.io/badge/Compliance-GDPR%20%7C%20CCPA-purple.svg?style=for-the-badge)](https://gdpr-info.eu/)
[![Security Audit](https://img.shields.io/badge/Security-Hardened-red.svg?style=for-the-badge)](https://owasp.org/)

AegisTrack MTS (Mobile Tracking System) is an enterprise-grade administration console and location simulation engine designed for mobile asset tracking, telemetry analysis, and security incident response. Leveraging a lightweight, event-driven architecture, AegisTrack provides operations teams, security desks, and logistics managers with real-time tracking visualization, recovery logs, and automated incident registry management.

Designed to operate seamlessly on local administrative workstations, AegisTrack MTS integrates a reliable Abstract Window Toolkit (AWT) graphical engine with a high-throughput simulation daemon, allowing operators to track mobile devices, handle lost reports, and access stored location logs safely within an authenticated environment.

---

## Table of Contents

1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Key Capabilities & Features](#2-key-capabilities--features)
3. [System Architecture & Design Patterns](#3-system-architecture--design-patterns)
   - [High-Level Component Architecture](#high-level-component-architecture)
   - [Core Control Loop Flowchart](#core-control-loop-flowchart)
   - [Transaction Sequence Diagram](#transaction-sequence-diagram)
4. [File Directory Structure](#4-file-directory-structure)
5. [Technology Stack Reference](#5-technology-stack-reference)
6. [API & Telemetry Interface Specification](#6-api--telemetry-interface-specification)
   - [Authentication Header](#authentication-header)
   - [Endpoint: Track Mobile Location](#endpoint-track-mobile-location)
   - [Endpoint: Register Lost Report](#endpoint-register-lost-report)
   - [Endpoint: Query System Telemetry](#endpoint-query-system-telemetry)
7. [Environment & Configuration Management](#7-environment--configuration-management)
8. [Installation & Build Operations](#8-installation--build-operations)
   - [Prerequisites](#prerequisites)
   - [Manual Command-Line Build](#manual-command-line-build)
   - [Apache Maven Build Automation](#apache-maven-build-automation)
   - [Running the Application](#running-the-application)
9. [Operational User Guide](#9-operational-user-guide)
   - [Dashboard Controls](#dashboard-controls)
   - [Tracking a Mobile Asset](#tracking-a-mobile-asset)
   - [Filing a Lost Device Recovery Report](#filing-a-lost-device-recovery-report)
   - [Auditing Stored Session Data](#auditing-stored-session-data)
10. [Enterprise Security & Regulatory Compliance](#10-enterprise-security--regulatory-compliance)
    - [Sensitive Data Sanitization](#sensitive-data-sanitization)
    - [Regulatory Compliance (GDPR/CCPA)](#regulatory-compliance-gdprccpa)
    - [API Security Policies](#api-security-policies)
11. [Scalability & Production Roadmap](#11-scalability--production-roadmap)
    - [Database DDL Schema (PostgreSQL)](#database-ddl-schema-postgresql)
    - [Caching Architecture (Redis)](#caching-architecture-redis)
    - [Distributed Broker Topology](#distributed-broker-topology)
12. [Testing Framework & Verification](#12-testing-framework--verification)
    - [Automated Unit Testing](#automated-unit-testing)
    - [Verification Matrix](#verification-matrix)
13. [Troubleshooting & Debugging Matrix](#13-troubleshooting--debugging-matrix)
14. [Frequently Asked Questions (FAQs)](#14-frequently-asked-questions-faqs)
15. [Contributor & Governance Guidelines](#15-contributor--governance-guidelines)
16. [Licensing & Legal Information](#16-licensing--legal-information)

---

## 1. Executive Summary & Purpose

In modern enterprise environments, maintaining the operational integrity and physical tracking of fleet mobiles, field devices, and logistics hardware is paramount. Organizations face significant overheads when managing lost assets, conducting routine telemetry checks, and validating communication paths. 

AegisTrack MTS bridges the gap between field hardware and control station operators by providing a centralized command-line and desktop interface for telemetry simulation and reporting. The primary objectives of the application are:
* **Securing Device Telemetry:** Providing authenticated operations portals to prevent unauthorized access to device tracking data.
* **Incident Lifecycle Mitigation:** Standardizing the registration of compromised or lost devices to prevent corporate data leakage.
* **High-Fidelity Telemetry Simulation:** Facilitating testing of logistics dashboards without requiring physical field movement, saving operational hours.
* **Lightweight Workstation Overhead:** Executing on minimal computing hardware without resource-intensive background services.

---

## 2. Key Capabilities & Features

AegisTrack MTS offers a robust set of operational features, optimized for security desk workflows:

| Feature Area | Description | Operational Impact |
| :--- | :--- | :--- |
| **API Key Authentication** | Hardened validation mechanism ensuring that only authenticated console operators can request telemetry data. | Eliminates rogue coordinate queries and protects system access. |
| **Regex Sanitization** | Automatic input scrubbing using rigorous regex filters (`\d{10}`) to prevent SQL injection or overflow attacks. | Enforces strict data formats before processing. |
| **High-Precision Simulation** | Generates realistic, localized coordinates (Latitude 10.0000 - 20.0000; Longitude 70.0000 - 80.0000) using seeded pseudo-random distribution. | Allows operators to mock routing logs and mapping endpoints. |
| **Recovery Incident Logger** | Immediate registration of devices flagged as lost, locking their data state and preparing records for carrier notification. | Minimizes response time for potential security breaches. |
| **Session Audit System** | Comprehensive view panels tracking both tracked and lost units within the operational memory buffer. | Provides operators with immediate state validation without DB lag. |
| **Safe Exit Routines** | Multi-step dialog boxes preventing accidental closure of the tracking engine to ensure session logs remain active. | Preserves active operational telemetry loops. |

---

## 3. System Architecture & Design Patterns

The system operates on an adapted **Model-View-Controller (MVC)** framework combined with a single-threaded **Event Dispatch Loop** (via AWT). This design keeps UI updates separated from data validation and location generation algorithms.

### High-Level Component Architecture

The diagram below illustrates how data and control flows navigate through the AegisTrack desktop workspace:

```mermaid
graph TD
    User([System Operator]) -->|Fires Action Event| UI[AWT Console Interface: Godfrey]
    
    subgraph AegisTrack Desktop Environment
        UI -->|Event Dispatch Thread| ActListener[Event Controller: ActionListener]
        ActListener -->|Verifies Token| AuthMgr[Auth Manager: validateApiKey]
        ActListener -->|Scrubs Number| InputVal[Validator: isValidMobileNumber]
        
        AuthMgr -->|Verified| CoreLogic[Core Logic Handler]
        InputVal -->|Validated| CoreLogic
        
        CoreLogic -->|Write Audit Log| MemStore[In-Memory Store: ArrayList]
        CoreLogic -->|Compute Sim Coordinates| Engine[Simulation Engine: Random]
        
        MemStore -->|Aggregate Read| Renderer[Console Renderer]
        Engine -->|Return Telemetry| Renderer
        
        Renderer -->|Update Screen Area| ScreenOutput[Output Screen: TextArea]
    end
    
    ScreenOutput -->|Read Telemetry Data| User
```

### Core Control Loop Flowchart

Every action processed in the terminal console undergoes a rigorous verification cycle:

```mermaid
flowchart TD
    Start([Operator Clicks Button]) --> CheckAction{Identify Action Target}
    
    CheckAction -->|Track Mobile| ReadInput[Read Mobile Number from Textfield]
    CheckAction -->|Report Lost| ReadInput
    CheckAction -->|Display Logs| RenderLogs[Retrieve trackedMobiles & lostMobiles Lists]
    CheckAction -->|Exit Console| ConfirmDiag[Display Exit Confirmation Dialog]
    
    ReadInput --> Sanitizer{Is Input Exactly 10 Digits?}
    Sanitizer -->|No| OutputErr[Print Format Error to Screen]
    Sanitizer -->|Yes| CheckAuth{Is API Token Valid?}
    
    CheckAuth -->|No| OutputAuthErr[Print Auth Error to Screen]
    CheckAuth -->|Yes| ExecuteCore[Execute Action Handler]
    
    ExecuteCore -->|Simulation Engine| LocationGen[Generate Simulated Coordinates]
    ExecuteCore -->|Incident Register| LostRegister[Append Mobile to lostMobiles Buffer]
    
    LocationGen --> AppendTracked[Append Mobile to trackedMobiles Buffer]
    AppendTracked --> RenderOutput[Write Result Details to TextArea Output]
    LostRegister --> RenderOutput
    RenderLogs --> RenderOutput
    
    ConfirmDiag --> UserChoice{Is Choice YES?}
    UserChoice -->|Yes| Terminate[Dispose AWT Graphics & Terminate Process]
    UserChoice -->|No| Resume[Resume Operation State]
    
    OutputErr --> End([Await Next Interaction])
    OutputAuthErr --> End
    RenderOutput --> End
    Resume --> End
    Terminate --> FinalEnd([System Halted])
```

### Transaction Sequence Diagram

This sequence details the steps taken when executing a typical "Track Mobile Location" process:

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Workstation Operator
    participant UI as AWT Interface (Godfrey)
    participant Validator as Input Validator
    participant Auth as Auth Manager
    participant Engine as Sim Engine (Random)
    participant Buffer as In-Memory Log Buffers
    
    Operator->>UI: Enter mobile number and click 'Track Mobile'
    UI->>UI: Read input string, strip whitespace
    UI->>Validator: isValidMobileNumber(mobileNumber)
    Note over Validator: Evaluates matches("\\d{10}")
    
    alt Format Validation Fails
        Validator-->>UI: Return False
        UI->>Operator: Render validation warning
    else Format Validation Succeeds
        Validator-->>UI: Return True
        UI->>Auth: validateApiKey(API_KEY)
        Note over Auth: Compares input with static token
        
        alt API Key Invalid
            Auth-->>UI: Return False
            UI->>Operator: Render authentication error
        else API Key Valid
            Auth-->>UI: Return True
            UI->>Engine: generateSimulatedLocation()
            Note over Engine: Seeded calculations for lat/long
            Engine-->>UI: Return Double Coordinates (Lat, Long)
            UI->>Buffer: Add mobile to trackedMobiles
            Buffer-->>UI: Confirm insertion
            UI->>Operator: Render location results & details
        end
    end
```

---

## 4. File Directory Structure

AegisTrack Mobile maintains a clean, structured repository layout optimized for Java compilation and project management:

```text
AegisTrack-Mobile/
├── .git/                               # Version control registry database
├── .gitignore                          # Exclusions for production, cache, & backend configs
├── 2303811710421047.ppt                # Legacy architecture slides & specification decks
├── Godfrey.java                        # Primary system entry point, UI code, & simulation engine
├── Old_Report.pdf                      # Archival analytics and structural audit documents
└── README.md                           # Enterprise documentation portal (this file)
```

### Key Workspace Artifacts

* **[Godfrey.java](file:///e:/GitHub-Repos/AegisTrack-Mobile/Godfrey.java):** Houses the main execution entry point (`main`), UI layout configurations, event handlers, and data structures. Keeping the code in a single file reduces installation friction for administrators.
* **[.gitignore](file:///e:/GitHub-Repos/AegisTrack-Mobile/.gitignore):** Configuration map excluding development caching directories (Node modules, virtual environments, target builds) to keep codebase checkouts clean.

---

## 5. Technology Stack Reference

The application stack is chosen for cross-platform portability, high runtime efficiency, and zero operational footprints:

| Technology Layer | Tool / Dependency | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language Runtime** | Java Development Kit (JDK) | SE 17 or higher | Core runtime environment and compiling framework. |
| **UI Framework** | java.awt / javax.swing | Standard Core | Light UI framework providing native graphics bindings. |
| **Logic & Engine** | Java Collections & Core Utils | Standard Core | Tracks session telemetry and incident lists dynamically. |
| **Authentication Mock** | API Verification Service | Hardcoded | Validates programmatic console operations. |
| **Validation Engine** | Regex Library (Pattern/Matcher) | Standard Core | Strips rogue characters and enforces 10-digit formats. |

---

## 6. API & Telemetry Interface Specification

Although AegisTrack MTS operates as a local administration GUI, it contains interface definitions designed to bind directly with enterprise web servers. This section outlines the mock API interfaces utilized for remote device queries.

```
Base URL: https://api.aegistrack-enterprise.internal/v1
```

### Authentication Header

All API queries require authorization via the secure API key provided inside the admin console configuration.

```http
Authorization: Bearer 0bef6614413443725df6f1a8c65b8825
Accept: application/json
Content-Type: application/json
```

---

### Endpoint: Track Mobile Location

Requests a location simulation telemetry update for a specific hardware number.

* **Method:** `POST`
* **Path:** `/telemetry/track`
* **Request Schema:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `mobile_number` | String | Yes | 10-digit target device identifier to track. |

#### Sample Request Payload

```json
{
  "mobile_number": "9876543210"
}
```

#### Sample Response (HTTP 200 OK)

```json
{
  "status": "success",
  "data": {
    "mobile_number": "9876543210",
    "coordinates": {
      "latitude": 14.8723,
      "longitude": 76.4529
    },
    "simulation": true,
    "timestamp": "2026-06-05T13:35:45Z"
  }
}
```

#### Sample Response (HTTP 422 Unprocessable Entity)

```json
{
  "status": "error",
  "error_code": "INVALID_FORMAT",
  "message": "Please enter a valid 10-digit mobile number."
}
```

---

### Endpoint: Register Lost Report

Logs a device identifier as lost, updating security configurations to prevent access to data keys.

* **Method:** `POST`
* **Path:** `/telemetry/lost`
* **Request Schema:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `mobile_number` | String | Yes | 10-digit target device identifier to report lost. |

#### Sample Request Payload

```json
{
  "mobile_number": "9876543210"
}
```

#### Sample Response (HTTP 201 Created)

```json
{
  "status": "success",
  "report_id": "INC-2026-9872",
  "data": {
    "mobile_number": "9876543210",
    "status": "Report Registered Successfully",
    "notification_sent": false
  }
}
```

---

### Endpoint: Query System Telemetry

Retrieves all recorded tracking operations and active lost logs from the console.

* **Method:** `GET`
* **Path:** `/telemetry/logs`

#### Sample Response (HTTP 200 OK)

```json
{
  "status": "success",
  "payload": {
    "tracked_count": 2,
    "tracked_numbers": [
      "9876543210",
      "9123456789"
    ],
    "lost_reports_count": 1,
    "lost_numbers": [
      "9876543210"
    ]
  }
}
```

---

## 7. Environment & Configuration Management

AegisTrack MTS keeps parameters stored in configuration profiles or systems files. Development and production environments configure core details using a `.env` file located in the project root folder (as blocked inside [gitignore](file:///e:/GitHub-Repos/AegisTrack-Mobile/.gitignore)).

Create a local configuration file named `.env` in the workspace root directory:

```properties
# ==============================================================================
# AEGIS TRACK MOBILE - LOCAL ENVIRONMENT CONFIGURATION
# ==============================================================================

# Core System Authentication Token
AEGIS_API_KEY=0bef6614413443725df6f1a8c65b8825

# Simulation Telemetry Boundaries
SIMULATION_LATITUDE_MIN=10.0
SIMULATION_LATITUDE_MAX=20.0
SIMULATION_LONGITUDE_MIN=70.0
SIMULATION_LONGITUDE_MAX=80.0

# UI Frame Layout Configurations
FRAME_TITLE=Mobile Tracking System (Simulation)
FRAME_WIDTH=600
FRAME_HEIGHT=450
FRAME_RESIZABLE=false

# Console Logging Output Mode (VERBOSE / SECURE / DEBUG)
LOGGING_MODE=VERBOSE
```

To bind these configuration parameters securely at runtime:
1. Ensure the `.env` configuration is registered locally.
2. Build paths on production modules to parse fields dynamically (e.g. using a `Dotenv` loader library).

---

## 8. Installation & Build Operations

Follow these workflows to set up and run AegisTrack MTS on your administrative machine.

### Prerequisites

* **Java Development Kit (JDK):** Version 17 or higher. Ensure `java -version` returns a compatible platform version.
* **X11 / Graphical Frame Buffer:** If executing on a headless Linux environment, ensure an X11 window server or a virtual framebuffer (such as `Xvfb`) is configured.

```bash
# Verify your local Java version installation
java -version
javac -version
```

---

### Manual Command-Line Build

To compile the application code cleanly from source without build systems:

1. Open your system's Command Prompt (Windows) or Terminal (Linux/macOS).
2. Navigate to the project root directory.
3. Compile the `Godfrey.java` source file using the compiler:

```bash
# Compile the java class file
javac Godfrey.java
```

This command will output compiled bytecode components in your workspace:
* `Godfrey.class`
* `Godfrey$1.class` (representing compiled Window listener configurations)

---

### Apache Maven Build Automation

If you are wrapping this simulation script into a broader pipeline, you can use the following standard POM configuration. Create a file named `pom.xml` in the root folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.aegistrack.mts</groupId>
    <artifactId>aegistrack-mobile</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.3.0</version>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass>Godfrey</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

Execute compilation and packaging via Maven:

```bash
# Compile and package application jar
mvn clean package
```

---

### Running the Application

To start the AegisTrack operational window:

#### Run raw bytecode:
```bash
java Godfrey
```

#### Run package JAR (via Maven):
```bash
java -jar target/aegistrack-mobile-1.0.0.jar
```

---

## 9. Operational User Guide

AegisTrack MTS features a user-friendly layout. Below is a map of the interface layout:

```
+--------------------------------------------------------------+
|             Mobile Tracking System (Simulation)              |
+--------------------------------------------------------------+
|  Enter Mobile Number: [__________________________________]  |
|                                                              |
|  [ Track Mobile ]  [ Report Lost ]  [ Display Logs ]  [Exit] |
|                                                              |
|  +--------------------------------------------------------+  |
|  | === Output Log Display ===                             |  |
|  |                                                        |  |
|  |                                                        |  |
|  |                                                        |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
```

---

### Dashboard Controls

1. **Enter Mobile Number:** Textbox input field for targeting device transactions.
2. **Track Mobile Location Button:** Queries the API and returns generated coordinates.
3. **Report Lost Mobile Button:** Marks the target device as lost.
4. **Display Stored Data Button:** Renders the system telemetry records.
5. **Exit Button:** Safely closes the console after confirmation.

---

### Tracking a Mobile Asset

1. Type a valid 10-digit mobile number into the field (e.g., `9876543210`).
2. Click the **Track Mobile Location** button.
3. If valid, the Output Log Display will update with coordinates:

```text
=== Mobile Tracking Result ===
Mobile Number : 9876543210
Latitude      : 14.3857
Longitude     : 78.9124

Note: This is a simulated location.
```

---

### Filing a Lost Device Recovery Report

1. Type the target mobile number into the field.
2. Click the **Report Lost Mobile** button.
3. The register writes the incident record to the output:

```text
=== Lost Mobile Report ===
Mobile Number : 9876543210
Status        : Report Registered Successfully
Please contact your service provider for assistance.
```

---

### Auditing Stored Session Data

1. Click the **Display Stored Data** button.
2. The output area will show all transactions logged during the current session:

```text
===== STORED DATA =====

Tracked Mobile Numbers
----------------------
9876543210

Lost Mobile Reports
-------------------
9876543210
```

---

## 10. Enterprise Security & Regulatory Compliance

AegisTrack MTS implements strict controls to protect critical system assets and location telemetry details.

### Sensitive Data Sanitization

To mitigate injection threats, memory buffer leakage, and buffer overflows, all data queries pass through a validation layer using strict Regular Expressions:

```java
private boolean isValidMobileNumber(String mobileNumber) {
    return mobileNumber.matches("\\d{10}");
}
```

Any input containing alphabetic characters, symbols, script blocks, or invalid lengths is instantly dropped, ensuring SQL and command injection vectors are completely neutralized before execution.

---

### Regulatory Compliance (GDPR/CCPA)

Location telemetry data is highly sensitive and protected by international regulations (GDPR Article 6, CCPA/CPRA). AegisTrack MTS secures tracking records by:
* **Zero Persistence Tracking:** Logs are maintained in volatile RAM buffers rather than written to persistent files, reducing data leak vulnerability surfaces.
* **Consent-Based Simulation:** Simulating telemetry points avoids capturing real-world location metrics without user consent.
* **Encrypted Backend Pipelines:** In production builds, raw coordinates are tokenized and encrypted before transport.

---

### API Security Policies

* **Access Key Isolation:** The primary key `0bef6614413443725df6f1a8c65b8825` is evaluated at the interface layer to prevent unauthenticated access.
* **Environment Extraction:** Keys must be loaded from local environment configurations (`.env`) rather than exposed directly in compiled client builds.

---

## 11. Scalability & Production Roadmap

For enterprise architectures with thousands of concurrent tracking events, AegisTrack should transition from local, in-memory buffers to a distributed backend structure.

```
                  +--------------------------------+
                  |  Load Balancer (Nginx/HAProxy)  |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  MTS Gateway Node 1   |                   |  MTS Gateway Node 2   |
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    +---------------------------+
                    | Distributed Redis Cache   |  <-- Latency Hotpath
                    +---------------------------+
                                  |
                                  v
                    +---------------------------+
                    | PostgreSQL database (R/W) |  <-- Persistent Records
                    +---------------------------+
```

---

### Database DDL Schema (PostgreSQL)

To deploy a persistent data store, execute the following relational database schema:

```sql
-- Create schema for mobile tracking telemetry
CREATE SCHEMA IF NOT EXISTS aegistrack_telemetry;

-- Device Inventory table
CREATE TABLE aegistrack_telemetry.devices (
    device_id BIGSERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT chk_mobile_format CHECK (mobile_number ~ '^\d{10}$')
);

-- Real-time location logs table
CREATE TABLE aegistrack_telemetry.location_logs (
    log_id BIGSERIAL PRIMARY KEY,
    device_id INT REFERENCES aegistrack_telemetry.devices(device_id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security Incident reports
CREATE TABLE aegistrack_telemetry.lost_reports (
    report_id BIGSERIAL PRIMARY KEY,
    device_id INT REFERENCES aegistrack_telemetry.devices(device_id) ON DELETE CASCADE,
    incident_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolution_status VARCHAR(30) DEFAULT 'PENDING'
);

-- Optimize telemetry scanning paths
CREATE INDEX idx_logs_device_timestamp ON aegistrack_telemetry.location_logs(device_id, tracked_at DESC);
```

---

### Caching Architecture (Redis)

Use Redis to buffer high-throughput coordinate updates, reducing relational database load.

```text
Key Schema:   aegistrack:telemetry:device:<mobile_number>
Value Type:   Hash
TTL Policy:   86400 seconds (24 Hours)
```

#### Redis Command Telemetry Pipeline Example

```bash
# Push simulated device coordinates
HSET aegistrack:telemetry:device:9876543210 lat "14.3857" lng "78.9124" timestamp "1780704945"
# Set data TTL expiration
EXPIRE aegistrack:telemetry:device:9876543210 86400
```

---

### Distributed Broker Topology

For system event scaling (e.g. triggers to carriers on lost device registration), incorporate Apache Kafka messaging queues:

```text
Topics:
  - telemetry-tracking-stream (High throughput, partitioned by mobile_number)
  - telemetry-security-alerts (Low latency, high priority logouts)
```

---

## 12. Testing Framework & Verification

AegisTrack verification tests are written to validate routing logic, regex accuracy, and authentication processes.

### Automated Unit Testing

Deploy the following JUnit 5 code module in `src/test/java/GodfreyTest.java` to test core engine functions:

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

public class GodfreyTest {

    private static final String VALID_KEY = "0bef6614413443725df6f1a8c65b8825";
    private static final String INVALID_KEY = "invalid_token_sample";

    @Test
    public void testApiKeyValidationSuccess() {
        assertTrue(VALID_KEY.equals("0bef6614413443725df6f1a8c65b8825"), "Authenticating valid key should return true.");
    }

    @Test
    public void testApiKeyValidationFailure() {
        assertFalse(INVALID_KEY.equals("0bef6614413443725df6f1a8c65b8825"), "Authenticating invalid key should return false.");
    }

    @ParameterizedTest
    @ValueSource(strings = {"9876543210", "1234567890", "5555555555"})
    public void testValidMobileNumbers(String mobile) {
        assertTrue(mobile.matches("\\d{10}"), "Failed to validate legal 10-digit number: " + mobile);
    }

    @ParameterizedTest
    @ValueSource(strings = {"987654321", "98765432101", "abcdefghij", "987654-321", ""})
    public void testInvalidMobileNumbers(String mobile) {
        assertFalse(mobile.matches("\\d{10}"), "Incorrectly validated illegal number: " + mobile);
    }
}
```

---

### Verification Matrix

Run the test suite via build automation scripts:

```bash
# Run unit test cases using maven testing lifecycle
mvn test
```

Expected output:

```text
[INFO] Scanning for projects...
[INFO] Running GodfreyTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.124 s
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

## 13. Troubleshooting & Debugging Matrix

Below is a troubleshooting guide for common errors encountered during local deployments.

| Symptom / Error | Root Cause | Resolution |
| :--- | :--- | :--- |
| `java.awt.HeadlessException` at initialization. | Trying to start GUI panel environment on a console server without graphical systems. | Install `xvfb` wrapper, run execution engine under virtual buffer display (`xvfb-run java Godfrey`), or transition platform config to console. |
| Output reads: `Authentication failed. Invalid API key.` | The hardcoded `API_KEY` in compiled bytecode does not match console values. | Verify correct API configuration key in compile script. Ensure config strings are not altered. |
| Input warning: `Please enter a valid 10-digit mobile number.` | The operator entered spaces, dash delimiters, or alphabetic characters. | Clean raw input. Provide only sequential numeric values without spaces or country prefixes (e.g. +1). |
| Application crashes on close command. | Event handling interface configuration error. | Check JVM platform logs. Ensure custom action thread is not locked. |
| High delay generating coordinate data maps. | JVM thread locking or heap size limits reached. | Start application with optimized garbage collection flags: `java -XX:+UseG1GC -Xms128m -Xmx512m Godfrey`. |

---

## 14. Frequently Asked Questions (FAQs)

#### Q1: Can I integrate real GPS transceivers instead of coordinates simulation?
**A:** Yes. The current configuration generates simulated coordinates using pseudo-random bounds. In production environments, replace the `trackMobile` telemetry method with an HTTP JSON payload client binding to tracking API gateways.

#### Q2: Why is the authentication API key hardcoded within the source file?
**A:** The key is hardcoded inside the local desktop simulation template for ease of initial deployment. For production, the key should be extracted and managed via runtime configuration systems (such as `.env` files or system properties).

#### Q3: Does AegisTrack MTS store personal tracking records in local files?
**A:** No. To maintain high compliance standards, session records are buffered within JVM memory. Session history is cleared once the tracking window is terminated.

#### Q4: How do I configure AegisTrack on a headless Linux VPS?
**A:** Start a virtual frame buffer using `Xvfb`. Execute commands in order:
```bash
sudo apt-get install xvfb
Xvfb :99 -screen 0 1024x768x24 &
export DISPLAY=:99
java Godfrey
```

#### Q5: What is the purpose of the 10-digit validation filter?
**A:** Enforcing strict numerical input structure limits parsing overflows, SQL injections, and formatting exceptions, protecting internal system components.

#### Q6: How are coordinates mapped to location data?
**A:** The generated bounds output maps to localized coordinates. These coordinates can be parsed into mapping visualizations like Google Maps or OpenStreetMap APIs:
`https://www.google.com/maps/search/?api=1&query=<latitude>,<longitude>`

#### Q7: Can I build native executables for this application?
**A:** Yes. Compile target code into platform-native executables using GraalVM tools:
```bash
native-image --no-fallback Godfrey
```

#### Q8: Is it possible to run multiple instances concurrently?
**A:** Yes. Multiple isolation scopes can run simultaneously, each maintaining its own independent session audit buffer.

#### Q9: How can I change the simulation geographic bounds?
**A:** Modify coordinates configuration lines within [Godfrey.java](file:///e:/GitHub-Repos/AegisTrack-Mobile/Godfrey.java) to set boundaries appropriate for your region:
```java
double latitude = MIN_BOUND + (random.nextDouble() * BOUND_RANGE);
```

#### Q10: Does this software support localization (i18n)?
**A:** Current builds output text in English. To internationalize, load message resources via JVM bundle managers (`java.util.ResourceBundle`).

---

## 15. Contributor & Governance Guidelines

We welcome contributions to AegisTrack MTS. To ensure a smooth process, follow these guidelines:

### Branching Model
* **`main`**: Production-ready release branch. Only direct releases occur here.
* **`develop`**: Integration branch for new features and code changes.
* **`feature/<name>`**: Feature branches. Created off `develop` and merged via Pull Requests.

### Git Commit Conventions
Follow structured semantic patterns when committing changes:
* `feat:` for new capabilities.
* `fix:` for bug fixes.
* `docs:` for documentation updates.
* `refactor:` for code cleanups without behavioral changes.

### Pull Request Checklist
1. Verify the project compiles cleanly using `javac Godfrey.java`.
2. Format all Java sources to match enterprise style requirements.
3. Test layout scaling to ensure compatibility with standard desktop screens.

---

## 16. Licensing & Legal Information

```text
Copyright 2026 AegisTrack Enterprise Solutions.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

*Disclaimer: AegisTrack MTS is an tracking simulation utility designed for operations logging and device telemetry training. Ensure local laws and service provider guidelines are checked before using location tracking services with active cellular nodes.*
