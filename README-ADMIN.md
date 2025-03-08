# 📚 GauntletAI Email Forwarding - Admin Guide

This guide explains how to use the admin dashboard and related tools for managing the GauntletAI email forwarding service.

## 🔒 Admin Dashboard

The admin dashboard allows you to manage all users and their email forwarding settings.

### 🔍 Accessing the Admin Dashboard

1. Log in with your admin account at `/login`
2. You will be automatically redirected to the admin dashboard at `/admin/dashboard`

### ✨ Features

- **View all users**: See a list of all users, their Gauntlet emails, forwarding emails, and status
- **Search**: Filter users by email address
- **Add users**: Add new users individually
- **Edit users**: Update forwarding email and status for existing users
- **Delete users**: Remove users from the system
- **Import users**: Bulk import users from a list of emails
- **Export users**: Export all user data to a CSV file

## 🔧 Managing Users

### ✨ Adding a Single User

1. Click the "Add User" button in the top right
2. Enter the user's email address (either full email or just the username)
3. Click "Add User"

### 📝 Editing a User

1. Click the edit (pencil) icon next to the user
2. Update the forwarding email and/or status
3. Click "Save Changes"

### 🗑️ Deleting a User

1. Click the delete (trash) icon next to the user
2. The user will be removed immediately (no confirmation dialog yet)

### 📤 Importing Users from Slack

#### Method 1: Using the Import Dialog

1. Copy email addresses from Slack
2. Click the "Import Users" button
3. Paste the copied text into the textarea
4. Click "Import Users"

#### Method 2: Using the Import Script

We've created a utility script to help extract emails from Slack data:

```bash
# Make sure the script is executable
chmod +x scripts/import-slack-emails.js

# Method 1: Interactive mode
node scripts/import-slack-emails.js

# Method 2: From a file
node scripts/import-slack-emails.js slack-data.txt gauntlet-emails.csv
```

##### How to get Slack data:

1. In Slack, go to the channel with your students
2. Click on the channel name at the top to see member list
3. Copy the member list (including names and emails)
4. Paste into a text file or directly into the script when prompted

The script will:
- Extract all email addresses
- Filter to only include Gauntlet emails
- Save them to a CSV file
- Print them to the console for easy copying

## 🔄 User Statuses

- **ACTIVE**: Email forwarding is enabled
- **INACTIVE**: User exists but has not set up forwarding
- **PAUSED**: Email forwarding is temporarily disabled

## 📊 Exporting User Data

1. Click the "Export Users" button
2. A CSV file will be downloaded with all user data
3. This file can be opened in Excel or any spreadsheet software

## 🐛 Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Make sure you're logged in with an admin account
3. Try refreshing the page
4. Contact the development team if issues persist

---

For technical details about the implementation, please refer to the main README.md file. 