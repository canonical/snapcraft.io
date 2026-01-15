# Local Redis for Development

This setup provides a local Redis instance for development and testing purposes.

## Getting Started

1. Ensure Docker is installed.
2. ```cd cache``` and run ```docker compose run redis-cli```

3. Then you can interact with the redis server.
   To check all saved keys use:
   ```
   KEYS *
   ```
4. To exit the interactive prompt, run
   ```
   exit
   ```
5. To stop the container, run:
   ```
   docker compose down
   ```
For more Redis CLI commands, check the docs at https://redis.io/learn/howtos/quick-start/cheat-sheet