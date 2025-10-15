ShareSource is a web-based platform designed to streamline file sharing, collaboration, and accessibility across users. This document provides setup and run instructions for local development.

ADMIN ACCOUNT: 
admin@sharesource.com
123admin123

**HOW TO RUN SHARESOURCE**

**Prerequisites**
1. Node.js
2. MongoDB Atlas

Setting Up Permissions (Windows)
1. Open Windows Powersell as Administrator.
2. Run the following command:

      Set-ExecutionPolicy RemoteSigned
      
3. When prompted, type A then press Enter.

Setting Up Sharesource:
1. Clone this repository:

      git clone <link>
          
2. Open the cloned repository in your VS Code.
3. Open a terminal in VS Code.

**Backend Setup**
4. Navigate to the backend folder:

      cd backend
      
5. Install dependencies.

      npm install

**Frontend Setup**
6. Open a new terminal in VS Code (keep the backend terminal open).
7. Navigate to the frontend folder:

      cd frontend/my-app

8. Install dependencies

      npm install

**Running the Application**
1. In the backend terminal:

      node server.js

2. In the frontend terminal:

      npm run dev

3. Once it's running, follow the link shown in the terminal

      (http://localhost:5173/)

**You're All Set!**
You can now explore and use Sharesource on your browser.
