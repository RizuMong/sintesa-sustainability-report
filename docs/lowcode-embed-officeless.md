# Lowcode Embed in Officeless Apps

## 1. Overview

This document establishes the **implementation standards** for **embedding web applications** (low-code) as page components **within the Officeless Gen 2** application, ensuring full compliance with Mekari security guidelines. It serves as the definitive guide for implementing **Workflow API** authentication, utilizing **Workflow Functions** for secure token encryption and provisioning, and managing token retrieval and lifecycle within the **embedded web app**.

### Success Criteria

- **External Page Rendering:** The Officeless Gen 2 application must successfully render the target external URL within the embedded view, ensuring full interactivity.
- **Secure Token Transmission:** Upon rendering the page component, the Officeless application must generate and securely pass an encrypted authentication token to the embedded web application.
- **Token Implementation:** The embedded web application must accept the encrypted token and append it to the Authorization header for all subsequent calls to Workflow APIs.
- **Backend Validation:** Workflow APIs residing in the same project must be able to decrypt the received Authorization header and validate the authenticity of requests from the embedded web application.

### Out of Scope

- Cross-project authentications by workflow.
- Any Single Sign-On (SSO).
- Refresh token implementations.
- Authorization scope implementations in the encrypted token.
- Cookies implementation.

### Assumptions

- The embedded web app (low-code) is to be developed and implemented by Mekari team.
- The embedded web app (low-code) is rendered fully on the client-side (static web page).
- The value of `iv (Initialization Vector)` keys, `salts`, used by Officeless built-in encryption functions are handled directly by the Officeless platform and cannot be managed in the implementation layer.

### Constraints

- Project variables with type of secret cannot be accessed using `_variableProject` method directly in the URL construction field, instead it has to be accessed via workflow function (server-actions).
- Global variables with type of secret cannot be accessed using `_variableGlobal` method directly in the URL construction field, instead it has to be accessed via workflow function (server-actions).
- Data categorized as Personal Identifiable Informations (PII) such as **emails**, **usernames** cannot be exposed to the embedded web application (low-code).

### Dependencies

#### **Implementation**

- Low-code deployments.

#### **Officeless Platform**

- iFrame component used by Officeless apps for embedding web apps.
- Project variable utilized via `_variableProject` method.
- Workflow Function and API.
- Built-in encryption function for AES-256 algorithm utilized via `_aes256Encrypt` and `_aes256Decrypt`.

## 2. Technical Design

### 2.1 Architecture & Tech Stack

- **Frontend**: React.js / Next.js / Vue.js
- **Officeless Platform**:
    - Officeless Layout Component: Embed URL (iFrame)
    - Officeless Workflow Function
    - Officeless Workflow API
    - Officeless Variable Manager
    - Officeless AES-256 Encryption

The **integration of a static Web App (Lowcode)** within the Officeless Platform utilizing an **iframe  component** within the primary App Page to serve authenticated users. To establish a **secure session**, a backend **Workflow Function** obtains encryption keys from the Variable Manager and user context from the Officeless Database, subsequently **injecting an encrypted authentication token** into the Web App via query parameters.

Operational interactions are executed through the Web App's **HTTPS requests to the Workflow API**, which **validates the provided credentials** against the Workflow Function logic to ensure authorized access to platform services.

Src: <https://analytics.mekari.com/plantuml/diagram?id=GkQ07qsUxc6u> 

### 2.2 Sequence

The sequence initiates with the **Officeless App triggering a Workflow Function** to synthesize a secure session payload, utilizing a stored encryption variable to package user context into an **encrypted authentication token** delivered to the embedded interface via query parameters.

Upon initialization, the** Web App (Lowcode) temporarily store the token in local state** to authorize subsequent HTTPS requests against the **Workflow API**, which delegates the credential decryption and validation logic back to the **Workflow Function** to ensure the integrity of the user session.

Depending on the verification outcome, the system either proceeds to **execute business logic and render data** upon successful authentication or enforces strict exception handling by returning **401 Unauthorized responses**, triggering a modal message or an error view based on the specific failure condition (expiration or invalidity).

Src: <https://swimlanes.io/#xVPBjtMwEL37K0Y9oFZaVgVxygEpooGtQNsq7GoRl2hqT4qpYxvbYQlfj520sNttpF0OcEtm/J7fvDcOMijK4IY2kFsLRbMhIaTegtSwqmvJSZH3qecZY0cVeP76N3L6wdxyI2iWQUlakAM1FE6CjNvVsQ9vW82DNDqDN6gU1PtfqLANXyrq1ZCo0NrphDR3nQ2TGXsAH+F8RwGq7+gkbhStnflKPJz3pFUkq3bUPYmKt86RDtD6OJ3AgGeAWsBeV185xXfaJIvRD4sOG/jWkusyKAYeEpCGh2B2pBl7AB0x/WMwjgZQys4HDAQNatxSk0RPAzXWuGiG6mYjrAft+Xq5DyR+wa2MavIoyTj5E/uZLghjwtlh9GPJd3j+Om1BQ9pnA+uM/Y/UF4OImFOnDAp41s8Z7ZQ82ZsWYSzxe17mf1DpgCNvjfbEmKzvNUmMm9cTFT+It/HmTeulTi9Kma3kR6CxVzlcCr7lPEGnqZHBy/l8bB9Gn3a/6oyUj/iiLKur1fvisio+rZdlsXiaGnLOuIOWV/MXj9eykN4q7KCJw8Qtz2CyVoSR0lEflo3FyV2V15f59dXFqlx+/nci94ZFTK8nytHiFw==> 

### 2.3 Implementation

#### Token Payload Structure

```js
{
  user_email: "john.doe@mekari.com",
  created_at: 190129920
}
```

#### auth\_lowcode (Workflow Function)

Function naming convention: `auth_lowcode`

This function acts as an authentication handler that issues encrypted, time-limited tokens for valid users and verifies incoming tokens by decrypting them and checking for both expiration and database existence.

```js
var encryption_key = _variableProjectSecret.enc_key_lowcode
var user_table_id = _variableProject.user_table_id

res = {
  error: true,
  message: "ERR_UNAUTHORIZED",
  data: ""
}

try {
  if (req.method == "encrypt") {
    var filter = {
      _filter_version: 2,
      where_is_and: {
        email: _user.email,
      },
    };
    var sort = {
      created_at: -1
    }
    var userData = _findRecords(user_table_id, 1, 1, sort, filter, "and") || []

    if (userData.length == 0) {
      throw new Error("ERR_UNAUTHORIZED")
    }

    var user_email = userData[0].email
    var payload = {
      user_email: user_email,
      created_at: new Date().getTime()
    }
    var string_payload = JSON.stringify(payload)

    res.data = _aes256Encrypt(encryption_key, string_payload)
    res.error = false
    res.message = "Success encrypt auth token"

  } else if (req.method == "decrypt") {
    var token = req.header.Authorization[0]
    
    var decrypted = _aes256Decrypt(encryption_key, token)
    var payload = JSON.parse(decrypted)
    var ONE_HOUR_MS = 3600000
    var currentTime = Date.now();

    if ((currentTime - payload.created_at) > ONE_HOUR_MS) {
      throw new Error("ERR_TOKEN_EXPIRED")
    }

    var filter = {
      _filter_version: 2,
      where_is_and: {
        email: payload.user_email,
      },
    };
    var sort = {
      created_at: -1
    }
    var userData = _findRecords(user_table_id, 1, 1, sort, filter, "and") || []

    if (userData.length == 0) {
      throw new Error("ERR_UNAUTHORIZED")
    }

    res.data = payload.user_email
    res.error = false
    res.message = "User authenticated"
  }

} catch (error) {
  res.data = ""
  res.error = true
  res.message = "ERR_UNAUTHORIZED"
  _log(res)
  _log(error)
  _stopAutomation();
}

_log(res)
```

#### Embed URL (Officeless Layout Component)

`base_url_[app_name]`: All base\_urls need to be set as project variables, centralizing configurations.

Query parameters:

- `env`: Environment value (`development` or `production`) set as *global variable* (with type: *generic*) in Officeless Global Variable Manager.
- `company_id`: Identifier for Officeless CID.
- `token`: Short-lived temporary auth token granted by the Workflow Function.

Example URL: 

```js
_variableProject.base_url_hse_dashboard + "/page_abc" +
  "?env=" + _variableGlobal.environment +
  "&company_id=" + _user.company_id +
  "&token=" + _hitFunction("auth_lowcode", {
    method: "encrypt"
  }).data
```

#### Workflow APIs

```js
var authentication = _hitFunction("auth_lowcode", {
  method: "decrypt",
  header: req.header
})

if(authentication.error) {
  res = {
    code: 401,
    error: true,
    message: authentication.message,
    data: null
  }
  _stopAutomation()
}

var user_email = authentication.data
//execute business logic after authenticated
```

#### Embedded Web App (Lowcode)

Upon mounting, the component extracts **authentication token** and **environment** (optionally also company\_id) parameters **from the URL query string** to initiate an asynchronous data fetch against a dynamically constructed API endpoint. The subsequent response processing enforces specific business logic, such as reloading the parent context upon token expiration or restricting the view when unauthorized access is detected.

Example for React.js & Next.js

```js
import React, { useEffect, useState } from 'react';

const EmbeddedPage = () => {
  const [config, setConfig] = useState({ token: null, env: null });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenParam = queryParams.get('token');
    const envParam = queryParams.get('env');

    if (tokenParam && envParam) {
      setConfig({ token: tokenParam, env: envParam });
      fetchData(tokenParam, envParam);
    }
  }, []);

  const fetchData = async (token, env) => {
    try {
      const urlInfix = env === 'development' ? '-dev' : '';
      const apiUrl = `https://api-officeless${urlInfix}.mekari.com/`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}` 
        }
      });
      const result = await response.json();

      // 1. Handle Specific Business Logic Errors
      if (result.error === true) {
        if (result.message === "ERR_TOKEN_EXPIRED") {
          // Display message to reload page
          return;
        }

        if (result.message === "ERR_UNAUTHORIZED") {
          // Switch to 401 display
          return;
        }
      }

      // 2. Handle Standard HTTP Errors
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      // 3. Success
      // Execute UI logic and render

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  if (isUnauthorized) {
    // Display Error Page 401
  }
  
  return (
    <div>
      //Success render
    </div>
  );
};

export default EmbeddedPage;
```

Example for Vue.js

```js
<script setup>
import { ref, onMounted } from 'vue';
const config = ref({ token: null, env: null });

const fetchData = async (token, env) => {
  try {
    const urlInfix = env === 'development' ? '-dev' : '';
    const apiUrl = `https://api-officeless${urlInfix}.mekari.com/`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      }
    });
    const result = await response.json();

    // 1. Handle Specific Business Logic Errors
    if (result.error === true) {
      if (result.message === "ERR_TOKEN_EXPIRED") {
        // Display message to reload page
        return;
      }

      if (result.message === "ERR_UNAUTHORIZED") {
        // Switch to 401 display
        return;
      }
    }

    // 2. Handle Standard HTTP Errors
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    // 3. Success
    // Execute UI logic and render

  } catch (err) {
    console.error("Fetch error:", err);
  }
};

onMounted(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const tokenParam = queryParams.get('token');
  const envParam = queryParams.get('env');

  if (tokenParam && envParam) {
    config.value = { token: tokenParam, env: envParam };
    fetchData(tokenParam, envParam);
  }
});
</script>

<template>
  // UI Renders
</template>
```

## 3. High Availability & Security

### **3.1 High-Availability**

1. **Static Web Page (Low-code): **Deployed as static files in an object storage (cdn). 
2. **Officeless Platform :** Depends on Officeless infrastructure setup.

### **3.2 Security Implications**

To ensure the integrity of the embedded web application and the safety of user data, the following security controls and implementation standards must be strictly enforced within the implemented solution.

#### Cryptographic Standards

- **Algorithm:** All authentication tokens passed between the **Officeless App** and the **Embedded Web App (Lowcode)** must be encrypted using the **AES-256** algorithm.
- **Built-in Functions:** Implementation must utilize the proprietary Officeless server-side functions:
    - Encryption: `_aes256Encrypt(key, stringPayload)`
    - Decryption: `_aes256Decrypt(key, token)`
- **IV & Salt Handling:** The Initialization Vector (IV) and Salt generation are abstracted and managed entirely by the Officeless Platform’s internal services. Developers cannot and should not attempt to manually inject or modify IVs in the implementation layer, ensuring cryptographic consistency across the platform.

#### Execution Boundary

- **Strict Backend Processing:** All encryption and decryption operations must occur exclusively within the **Server-Side** context (Workflow Function and APIs).
    - *Encryption* happens within the **Workflow Function** (prior to rendering the lowcode app).
    - *Decryption* happens within the **Workflow API** (when the lowcode app requests data).
- **Client-Side Prohibition:** Cryptographic keys and encryption logic must never be exposed to, or executed by, the client browser (the "Apps User" or the "Web App" logic).

#### Secret Management

- **Generation & Ownership:** Encryption keys are **generated and managed entirely by the implementation teams**. The platform does not provide default keys for this implementation; teams must generate high-entropy random strings for use as keys.
- **Project Isolation (Key Uniqueness):** There is a strict **1-to-1 mapping between Projects and Keys**.
    - Each Officeless project must utilize a distinct, unique encryption key (different value for each environments, and projects).
    - Reusing keys across different projects is strictly prohibited to ensure tenant isolation and limit the "blast radius" in the event of a credential compromise.
- **Secure Storage:** Once generated, keys must be stored within the **Officeless Variable Manager**.
- **Variable Configuration:** The variable storing the encryption key must be scoped as a **Project Variable** with the specific type set to **"Secret"**.
    - *Implication:* This configuration prevents the raw value of the key from being exposed in the platform UI, browser network tabs, or server execution logs.

#### Token Lifecycle & Expiration

- **Time-To-Live (TTL):** Although the token is encrypted, it must carry a strict expiration policy. The token is valid for a maximum of **1 hour** from the timestamp of generation.
- **Validation:** The **Workflow API** must decode the token and validate the timestamp immediately. If `(Current Time - Generation Time) > 1 Hour`, the API must return `ERR_TOKEN_EXPIRED` (401).

#### Data Privacy & Payload Constraints (PII)

- **Data Minimization:** Any data passed to the embedded Web App via Query Parameters must **not** contain Personally Identifiable Information (PII).
- **Prohibited Data:**
    - Email addresses
    - Phone numbers
    - National ID numbers (SSN, KTP, etc.)
    - Full residential addresses
- **Allowed Data:** The payload should be limited to non-sensitive identifiers required for state management, such as:
    - Internal User ID
    - Role/Permission Group IDs
    - Company ID

## 4. Native Compatibility

### Compatibility

- iFrame used by the page component in Officeless Apps, including permissions and restrictions imposed on the iFrame component.

## 5. Concern, Questions, or Known Limitations

- Built-in mechanism for auth-token exchange for Embed Url components will start development in 2026Q2 (current rough estimate / plan, exact estimates will be updated further by Officeless Product team).
    - The token passed to an embedded web app (to be exchanged) is a one-time token.
    - Upon release of this native feature, the implementation pattern will be adjusted accordingly.
