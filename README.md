# ! LabOps Development (Node.js)
`Node.js v18+`

## Features

* 🌐 Global Ban/Timeout/Kick Commands Across Servers
* 🧾 Role Request System with Approval Workflow
* ⚙️ Assign, or Unassign,Roles
* 🧼 Mass Role Add, Remove, or Unrole Members
* 📋 Infraction Logging, Removal, and View Tools
* 🛠️ Channel Lockdown, Mute, and Cleanup Utilities
* 📊 User & Server Info Display
* 📷 Avatar & Role Info Lookup
* ⏱️ Custom Bot Presence & Status
* 🛡️ All Features Configurable via `config.json`

---

## Commands Overview

### 🧾 Role Management

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `/requestrole`        | Request a role, sends to approval channel |
| `/assignrole`         | Assign a role to a user                   |
| `/unassignrole`       | Remove a role from a user                 |
| `/assignmultiplerole` | Assign multiple roles to a user           |
| `/setrolemanager`     | Allow a role to manage other roles        |
| `/verify`             | Trigger verification logic                |

### 🌐 Global Moderation

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `/globalban`          | Ban a user from all servers                 |
| `/unglobalban`        | Unban a user from all servers               |
| `/globalkick`         | Kick a user from all servers                |
| `/globaltimeout`      | Timeout a user in all servers               |
| `/unglobaltimeout`    | Remove timeout from all servers             |
| `/setglobalrole`      | Allow roles to use global commands          |
| `/globallinkserver`   | Link a server to global system              |
| `/ungloballinkserver` | Unlink a server from global system          |

### 🧹 Moderation Tools

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `/slowmode`     | Set channel slowmode               |
| `/clear`        | Delete messages from a channel     |
| `/lock`         | Lock a channel                     |
| `/unlock`       | Unlock a channel                   |
| `/lockall`      | Lock all channels                  |
| `/unlockall`    | Unlock all channels                |
| `/mute`         | Mute a user                        |
| `/unmute`       | Unmute a user                      |

### ⚠️ Infractions System

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `/infractions`       | Show a user’s infractions             |
| `/infractionsclear`  | Clear a user's infractions            |
| `/infractionremove`  | Remove a specific infraction          |

### 🛠️ Utility

| Command       | Description                        |
| ------------- | ---------------------------------- |
| `/avatar`     | Show a user's avatar               |
| `/userinfo`   | Show user info                     |
| `/serverinfo` | Show server info                   |

### 🌐 Global Role Controls

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `/listglobalroles`   | Show all configured global roles    |
| `/removeglobalrole`  | Remove a global role                |
| `/clearglobalroles`  | Clear all global roles              |
| `/listlinkedguilds`  | Show linked guilds for global cmds  |

---

## Setup Requirements

* `Node.js v18+`
* Required files:
  * `.env` (contains `CLIENT_ID`, `BOT_TOKEN`, etc.)
  * `config.json`
  * JSON storage files:
    * `Ban_File.json`, `infractions.json`, `GlobalRoles.json`, `Guild_Linked.json`, etc.

---

## License

Copyright (c) realcrow2  
All rights reserved.

---

## Developer

* **Discord:** realcrow2 (`1228084539138506845`)  
* **GitHub:** [https://github.com/realcrow2](https://github.com/realcrow2)

---

*Contributions and suggestions are welcome. DM on Discord to get in touch.*
