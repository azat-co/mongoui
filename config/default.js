module.exports = {
  "env": {
    "doc": "The applicaton environment.",
    "format": ["production", "development", "test"],
    "default": "development",
    "env": "NODE_ENV"
  },

  "api": {
    "port": {
      "doc": "The Port the API server will to bind to.",
      "format": "port",
      "default": 3001,
      "env": "API_PORT"
    }
  },
  "dev": {
    "host": {
      "doc": "The Host the DEV server will to bind to.",
      "format": "*",
      "default": "localhost",
      "env": "DEV_HOST"
    },
    "port": {
      "doc": "The Port the DEV server will to bind to.",
      "format": "port",
      "default": "3000",
      "env": "DEV_PORT"
    }
  },
  "database": {
    "host": {
      "doc": "The Host the database is accessible from.",
      "format": "*",
      "default": "localhost",
      "env": "DEP_DB_HOST"
    },
    "port": {
      "doc": "The PORT the database is accessible from.",
      "format": "port",
      "default": "27017",
      "env": "DEP_DB_PORT"
    },
    "name": {
      "doc": "The name of the database which will be accessed.",
      "format": "*",
      "default": "mongoui",
      "env": "DEP_DB_NAME"
    },
    "username": {
      "doc": "The username for which has permissions to access the database.",
      "format": "*",
      "default": "",
      "env": "DEP_DB_USER"
    },
    "password": {
      "doc": "The password for the user to access the database.",
      "format": "*",
      "default": "",
      "env": "DEP_DB_PASS"
    }
  },
  "public": {
    "api": {
      "use_window_defaults": {
        "doc": "Use The Window's location as the defaults.",
        "format": Boolean,
        "default": "true",
        "env": "PUB_API_WINDOW"
      },
      "protocol": {
        "doc": "The Protocol to use when accessing the API server.",
        "format": ["http", "https"],
        "default": "http",
        "env": "PUB_API_PROTO"
      },
      "host": {
        "doc": "The Host the API server will be accessible from.",
        "format": "*",
        "default": "localhost",
        "env": "PUB_API_HOST"
      },
      "port": {
        "doc": "The Port the API server will be accessible from.",
        "format": "port",
        "default": "3001",
        "env": "PUB_API_PORT"
      }
    }
  }
}
