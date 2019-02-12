# Translagency App - lightweight business management system for translation agencies
## Setup guide
This guide explains how to setup the application on Ubuntu 18.04 assuming that we are using Digital Ocean droplet
### 1. Create a droplet with Ubuntu OS 18.04 on Digital Ocean
- as you are creating the new droplet set your ssh key for access
- change the ssh port to 225
  ```
   sudo nano /etc/ssh/sshd_config
  ```
  ```
  ...
  Port 225
  ...
  ```
- create admin user

  ```
  adduser admin --intogroup sudo
  ```
- add your SSH pub key in ```/home/admin/.ssh/authorized_keys``` in order to have access with admin user
  
### 2. Install prerequisites
- Install git

  ```
  sudo apt update
  sudo apt install git
  git --version
  ```
  
- now configure git

  ```
  git config --global user.name “Your Name”
  git config --global user.email “youremail@domain.com”
  ```
  
- install node.js

  ```
  sudo apt update
  sudo apt install nodejs
  sudo apt install npm
  nodejs -v
  ```
  
- install mongodb

  ```
  sudo apt update
  sudo apt install -y mongodb
  sudo systemctl status mongodb
  ```
  
- install wkhtmltopdf before using pdf otherwise you will get an error, run the following commands

  ```
  sudo apt-get install xvfb
  sudo add-apt-repository ppa:ecometrica/servers
  sudo apt-get update
  sudo apt-get install wkhtmltopdf
  ```
  
- install nginx

  ```
  sudo apt update
  sudo apt install nginx
  systemctl status nginx
  ```
  
- install certbot

  ```
  sudo add-apt-repository ppa:certbot/certbot
  sudo apt-get update
  sudo apt-get install python-certbot-nginx
  sudo nano /etc/nginx/sites-available/example.com
  ```
  
### 3. Setup the application
- clone the application (in order to clone the repo you need ssh access, contact at djzoning@gmail.com)
  ```
  git clone git@github.com:djzoning/translagency.git
  ```
  
- move to the app directory and install the node.js dependencies

  ```
  cd /path/to/the/app
  npm install
  ```
  
### 4. Setup nginx as reverse proxy server
- enter the config
  ```
  sudo nano /etc/nginx/sites-available/default

  . . .

  server_name <full.domain.name>;

      location / {
          proxy_pass http://localhost:9000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }

  sudo nginx -t

  sudo systemctl reload nginx

  sudo systemctl restart nginx
  ```
### 5. Create bash script file that will be run by the service’s systemd script file
- create app start file -> ```~/scripts/app-start.sh```
- set environment variables in a ```~/scripts/app-start.sh``` file and start the app from there as follows

  ```
  export NODE_ENV=production
  export PORT=9000
  export MONGO_DB_CONNECTION_STRING=mongodb://localhost:27017/translagency
  export ADMIN_PASSWORD=<admin-seed-password>
  export MAIL_SERVER_USER=admin@timset.com
  export MAIL_SERVER_PASS=<password>
  export MAIL_RECEIVER=<receiver-email>
  cd /home/admin/TimsetNode && node index.js
  ```
  
- make the script file executable

  ```
  chmod +x ~/scripts/app-start.sh
  ```
  
### 6. Create a systemd script file, that will run the app-start script in the background
- here is an example of a systemd script file

  ```
  sudo nano /etc/systemd/system/<service-name>.service
  ```

- this is sample systemd script

  ```
  [Unit]
  Description = test node
  After = network.target

  [Service]
  ExecStart = /home/<user>/scripts/test-node.sh
  Restart = on-failure

  [Install]
  WantedBy = multi-user.target
  ```

- save

  ```
  sudo systemctl daemon-reload
  sudo service <service-name> stop
  sudo service <service-name> start
  ```
  
### 7. Obtaining an SSL certificate
- generate certificate and set it with nginx

  ```
  sudo certbot --nginx -d example.com -d www.example.com
  sudo certbot renew --dry-run
  ```
  
### 8. Restore the demo database
- restore from db dump

  ```
  mongorestore -d <database-name> /path/to/db/backup
  ```
  
you can get a db dump from here -> https://drive.google.com/drive/u/0/folders/0ByeD3ubUK9VLZ2Nxc0xZSzFtVVk









