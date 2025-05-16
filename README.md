# Modbus Scan Project

This project is a tool for scanning and reading Modbus devices. It supports both RTU and TCP connections and allows users to configure the connection and registers to be read through JSON configuration files.

![Modbus] (img/ezgif.com-video-to-gif-converter.mp4)

## Features

- Supports Modbus RTU and TCP protocols.
- Flexible configuration through JSON files.
- Reads various types of registers (float, unsigned/signed integers).
- Outputs data with descriptions for easy interpretation.
- Allows the user to load the configuration from a file or from the command line.

## Usage

1. To start the application:
  - Open the terminal and navigate to the project directory.
  - Run the command `start node nameOfFile.js` or 'node nameOfFile.js'to start the application.
2. Specify the connection type, parameters, and registers to read.
3. Run the script with the configuration file as input.
4. The application will connect to the Modbus device and read the specified registers.


## Software

- VS Code;
- Node.js;
- Open ModSim (for testing purposes);
- Figma (for design purposes);
- Git (for version control);
- GitHub (for hosting the repository);

## Requirements

- 'node 8.17.0';

## Installation

- npm install;


# Configs

This folder contains the configurations for a specific device so that the user does not need to input
all of the information.

The information is structured as follows:


### Type

The type of configuration that the user will use:

* **rtu** -> For a RTU based modbus connection.
* **tcp** -> For a TCP based modbus connection.

### Connection

This should contain everything that the user needs for the connection with the exception of the serial port or the IP
depending on the type of connection.

#### RTU

```json
{
   "connection": {
        parity: "none",
        databits: 8,
        stopbits: 2,
        baudrate: 9600
    }
}

```

#### TCP

This should contain the IP address and the port of the device.


```json
{
    "connection": {
      "port": 502,
      "unitId": 1
    }
}
```

#### Registers

The register needs some information about itself for us to be able to read it, this information is
structured as follows.

* **type** -> This is the type of register that we are reading.
    * **f** -> A Float.
    * **u32** -> A Unsigned 32 bit integer.
    * **u16** -> A Unsigned 16 bit integer.
    * **int 32** -> A signed 32 bit integer.
    * **int 16** -> A signed 16 bit integer.
* **Arch** -> This is the architecture of the register.
    * **L** -> Little endian;
    * **B** -> Big endian;
* **function** -> This is the type of modbus function that will be used to read the register, possible values are:
    * **1** -> Read Coils.
    * **2** -> Read Discrete Inputs.
    * **3** -> Read Holding Registers.
    * **4** -> Read Input Registers.
    (...)
* **register** -> The actual register to read.
* **description** -> A description of the register

```json
{
    "registers": [
      {
        "type": "f",
        "isLE": false,
        "function": "3",
        "register": 9310,
        "multiplier": 0.001,
        "description": "frequency"
      }
    ]
}
```

## Example file


```json

{
  "serialCom": "/dev/ttyACM0",
  "startAddress": "0",
  "address": "4545",
  "function": "03-Read Holding Registers",
  "baudRate": "9600",
  "architecture": "Little Endian",
  "signal": "Unsigned",
  "type": "Int",
  "parity": "None",
  "stopBits": "2",
  "dataBits": "8",
  "description": ""
}



