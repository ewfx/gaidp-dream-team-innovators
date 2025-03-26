# 🚀 Project Name

## 📌 Table of Contents
- [Introduction](#introduction)
- [Demo](#demo)
- [Inspiration](#inspiration)
- [What It Does](#what-it-does)
- [How We Built It](#how-we-built-it)
- [Challenges We Faced](#challenges-we-faced)
- [How to Run](#how-to-run)
- [Tech Stack](#tech-stack)
- [Team](#team)

---

## 🎯 Introduction
Problem Statement

In industries dealing with regulatory compliance, Data Analysts often face challenges in interpreting complex regulatory instructions and applying them to large datasets for validation. The process of manually extracting rules from regulatory documents and ensuring compliance with datasets is:

    Time-consuming and prone to human errors

    Inconsistent, leading to incorrect rule interpretation

    Difficult to scale, as new regulations and datasets frequently change

    Lacking automation, requiring manual intervention for validation and anomaly detection

To address these challenges, we need a smart, automated solution that:

    Extracts clear, structured business rules from regulatory instruction files using LLMs (OpenAI GPT).

    Applies these rules to uploaded datasets to validate compliance automatically.

    Generates Python validation scripts dynamically to flag non-conforming records and suggest remedial actions.

    Leverages machine learning techniques for anomaly detection and provides insights in a downloadable format.

    Ensures that analysts can re-use extracted rules for future dataset validations without re-processing instructions.

This solution will reduce manual effort, increase accuracy, and streamline compliance validation for Data Analysts, enabling them to focus on strategic decision-making rather than repetitive rule extraction and data validation tasks

## 🎯 Architecture
![Architectual Design](https://github.com/user-attachments/assets/4f8dcc69-a41d-45d3-be3a-1f1f67a2d322)


## 🎥 Demo
🔗 [Live Demo](#) (if applicable)  : http://13.126.159.42:4000/
📹 [Video Demo](#) (if applicable)  : https://github.com/ewfx/gaidp-dream-team-innovators/blob/main/artifacts/demo/gaidp-dream-team-innovators-demo.mov
🖼️ Screenshots:

![Screenshot 2025-03-26 at 8 28 27 PM](https://github.com/user-attachments/assets/d03ca313-618e-4e1c-9cb4-a43750579c4a)
![Screenshot 2025-03-26 at 8 28 36 PM](https://github.com/user-attachments/assets/e59572f4-88f0-4462-aed0-cb68bc077ee0)
![Screenshot 2025-03-26 at 8 29 33 PM](https://github.com/user-attachments/assets/e066e7a4-0be2-4627-9086-ca2ea23e1091)
![Screenshot 2025-03-26 at 8 29 40 PM](https://github.com/user-attachments/assets/2f41b8da-0699-4c7f-aa43-003c4613bf71)




## 💡 Inspiration
Data Analysts face challenges in interpreting regulatory instructions and applying them to datasets for compliance. Manual rule extraction is time-consuming, error-prone, and inconsistent, increasing the risk of non-compliance and penalties.

With LLMs (OpenAI GPT) and automation, we can extract rules from regulatory texts, generate Python validation scripts, and detect anomalies—eliminating manual effort and ensuring accuracy. This solution streamlines compliance validation, making it scalable, efficient, and reusable for multiple datasets.


## ⚙️ What It Does
This solution automates regulatory compliance validation by:

1. Extracting Rules from Regulatory Texts – Uses LLMs (OpenAI GPT) to convert complex instructions into structured rules.

2. Applying Rules to Datasets – Allows users to upload datasets and validates them against extracted rules.

3. Generating Python Validation Code – Automatically creates and executes Python scripts to flag non-compliant records.

4. Detecting Anomalies – Uses machine learning to identify irregularities and suggest remedial actions.

5. Providing Scalable Rule Reusability – Saves extracted rules in a database, allowing users to apply them to new datasets without reprocessing.

This ensures faster, more accurate, and scalable compliance validation with minimal manual effort. 

## 🛠️ How We Built It
We build this solution using a scalable, AI-powered architecture with the following components:
1. User Authentication & File Upload

    Frontend (React.js/Next.js) – Allows users to sign up, log in, and upload regulatory instructions & datasets.

    Backend (Node.js, Express.js) – Handles authentication, file uploads, and API calls.

    MongoDB – Stores user data, extracted rules, and datasets.

2. Rule Extraction & Storage

    Node.js Backend API sends uploaded regulatory instructions to OpenAI GPT.

    LLM processes the text and extracts structured validation rules (JSON format).

    MongoDB stores extracted rules, enabling reuse across datasets.

3. Dataset Validation & Python Code Generation

    User uploads a dataset, which is sent to the backend API.

    Backend triggers OpenAI GPT to generate a Python validation script based on the rules.

    The Python script runs automatically and flags records that do not conform to the extracted rules.

4. Anomaly Detection & CSV Generation

    Machine learning techniques (e.g., scikit-learn, TensorFlow) detect anomalies in the dataset.

    The flagged records are annotated with suggested remedies.

    A new CSV file is generated and made available for download in the browser.

5. Scalable Rule Reusability & Continuous Processing

    Users can upload new datasets for the same rule set without re-extracting rules.

    The backend reuses stored rules and applies them dynamically.

    System supports continuous learning and updates based on user feedback.

Tech Stack Overview

    Frontend: React.js / Next.js

    Backend: Node.js (Express.js)

    Database: MongoDB

    AI Processing: OpenAI GPT for rule extraction & Python script generation

    Validation & ML: Python (pandas, NumPy, scikit-learn, TensorFlow)

    Storage & Processing: Cloud storage for file uploads, worker queues for handling large datasets

This approach ensures efficiency, automation, and scalability, making compliance validation seamless and intelligent. 


## 🚧 Challenges We Faced
1. Complex Regulatory Text Interpretation

    Regulatory documents contain ambiguous and unstructured language, making it challenging to extract precise validation rules.

    Solution: Used OpenAI GPT to interpret, refine, and structure the extracted rules into JSON format.

🚧 2. Ensuring Accuracy in Rule Extraction

    AI-generated rules sometimes lacked clarity or contained inconsistencies.

    Solution: Implemented a review and modification step where users can edit and refine the extracted rules before applying them.

🚧 3. Automating Python Code Generation & Execution

    Generating executable Python validation scripts dynamically while ensuring correct syntax and logic was a challenge.

    Solution: Used prompt engineering and test runs to validate script outputs before execution.

🚧 4. Handling Large Datasets Efficiently

    Validating and processing large datasets in real-time required optimized performance.

    Solution: Implemented asynchronous processing, batch execution, and worker queues to handle data efficiently.

🚧 5. Integrating Machine Learning for Anomaly Detection

    Finding the right ML models to detect anomalies without excessive false positives was tricky.

    Solution: Experimented with different ML algorithms (Isolation Forest, One-Class SVM, Autoencoders) to improve accuracy.

🚧 6. Ensuring Scalability & Reusability of Extracted Rules

    Users needed to apply the same rules to multiple datasets without re-extraction.

    Solution: Stored rules in MongoDB, allowing users to reuse them for future validations.

🚧 7. Security & Compliance Considerations

    Handling sensitive regulatory data required secure file storage and API access.

    Solution: Used encryption, role-based access control (RBAC), and secure API endpoints.

By overcoming these challenges, we built a robust, scalable, and intelligent compliance validation system.

## 🏃 How to Run
1. Clone the repository  
   ```sh
   git clone https://github.com/aidp-dream-team-innovators
   ```
2. Go to frontend and backend folder and Install dependencies seperately
   ```sh
   npm install
   ```
3. Run the project  
   ```sh
   npm start
   ```

## 🏗️ Tech Stack
- 🔹 Frontend: React 
- 🔹 Backend: Node.js
- 🔹 Database:MongoDb
- 🔹 Other: OpenAI API

## 👥 Team
- **Neeraj Sukheja**
- **Sneha Sethia**
- **Jeena Manuel**
- **Arabinda Mishra**
- **Anand Rema Haridasan**
