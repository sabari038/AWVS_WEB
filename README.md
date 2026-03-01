# VulnScan Pro Web Interface

A professional, enterprise-grade vulnerability management web application built on top of an Agentless Windows Vulnerability Scanner. This project features a React (Vite) frontend and a Node.js (Express) backend.

## Project Structure

- `frontend/` - React frontend built with Vite
- `backend/` - Node.js Express API server

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Python 3](https://www.python.org/) (required for the underlying vulnerability scanner and PDF generation)

## Installation

First, clone the repository to your local machine:
```bash
git clone https://github.com/sabari038/AWVS_WEB.git
cd AWVS_WEB/web
```

You need to install dependencies for both the frontend and backend separately.

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the necessary NPM packages for the Node.js server:
   ```bash
   npm install
   ```
3. Install the required Python dependencies for the scanning engine and PDF generator:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory (if not already present) with your configuration:
   ```env
   PORT=3001
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary NPM packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

## Running the Application

You will need to run both the backend server and the frontend development server simultaneously.

### Start the Backend Server

1. From the `backend` directory, run:
   ```bash
   npm start
   ```
   *(Alternatively, you can run `node server.js`)*
2. You should see a message indicating the server is running (e.g., `VulnScan Pro backend securely running on port 3001`).

### Start the Frontend Server

1. From the `frontend` directory, run:
   ```bash
   npm run dev
   ```
2. The terminal will provide a local URL (usually `http://localhost:5173`). Open this URL in your web browser to access the VulnScan Pro dashboard.

## Features

- **Dashboard:** Real-time metrics and risk score visualization.
- **Topology:** Dynamic 2D network map visualizing scanned assets and their connections.
- **Vulnerabilities:** Filterable list of all detected CVEs.
- **False Positives:** AI-powered engine to score, override, and confirm false positive alerts.
- **Reports:** Generate and download comprehensive findings in CSV or PDF formats.
