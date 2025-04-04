## Setup Instructions

## Environment Variables
Create a `.env` file based on `.env.example`.


## Running with Docker.
docker build -t my-app .
docker run -p 3000:3000 --env-file .env my-app

## To stop and remove containers.
docker stop container_id
docker rm container_id

## to run locally 
npm install
npm start

