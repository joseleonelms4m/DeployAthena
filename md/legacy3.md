# Use of this software

thi software owns to **MS4M** and all the licenses are private.

# Basic Configurations

In **development**, **config** file for development uses other values compared with the deploy version.

## Development

- username `root`
- passwords **[**`1234` `Ms4m4dm1nhub2025` `root`**]**
- remotePath `/home/ms4m`
- maxAttempts `5`
- port `2222`

## Deploy

- username `ms4m`
- passwords **[**`1234` `Ms4m4dm1nhub2025`**]**
- remotePath `/home/ms4m`
- maxAttempts `5`
- port `22`

# Architecture

This software follows a 3 layered architectured which splits the responsabilities of every part of the code to follow SOLID PRINCIPLES, uses native node.js to create a little REST API which uses polling technique in the frontend to refresh the data.

## Services

Responsable to persistence data stored in files, and does the connection to the remote server using the ssh protocol possible using NODE-SSH dependency.

## Controller

Responsable the handle both requests and responses and redirect the information to client and other layers.

## Routes 

This layer handles all the endpoints which the Deployer has, each endpoint handles one of the tasks required