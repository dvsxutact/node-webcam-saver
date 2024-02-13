# Node.js Timelapse Webcam

A simple Node.js application for capturing images from a webcam when a specific key is pressed, by default a new image is captured anytime the Zero (0) key is pressed and the application is in the foreground.

Pressing Q will cause the program to exit

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [Key Commands](#key-commands)

## Introduction

This Node.js application utilizes the `node-webcam` library to capture images from a webcam and saves them in a specified folder. The application is designed for creating a timelapse effect by capturing images at regular intervals.

## Features

- Webcam image capture
- Timelapse image naming with timestamp
- User-friendly key commands for control
- Configurable settings via `config.json`
- Dynamically detects the last captured image number to continue the sequence

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (https://nodejs.org/)
- npm (Node Package Manager, comes with Node.js installation)

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <project-directory>
2. Install dependencies:

    ```bash
    npm install
3. Edit the `config.json` file to customize the project settings:
4. Run the application using the following command:
    ```bash
    node app.js

## Key Commands
- Press 0 to capture an image.
- Press q to quit the application.
