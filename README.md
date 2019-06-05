# Vehicle manufacture IoT extension

## Prerequisites

- docker
- docker-compose
- node v8.9.x
- make
- g++
- jq

This demo has been tested to work on Ubuntu and MacOS.

## Installing the demo

Clone this git repository and then run the `install.sh` file located in the `installer` folder. This will bring up a Hyperledger Fabric network the 4 applications used in this demo. Once the installer has finished running the applications will be available at the following locations:

- Car builder - http://localhost:6001
- Manufacturer - http://localhost:6002
- Regulator - http://localhost:6003
- Insurer - http://localhost:6004

## Uninstalling the demo
Run `uninstall.sh` located in the `installer` folder. This will teardown the Hyperledger Fabric network and the applications used in the demo as well as cleaning artifacts left by the installer for tools used. The wallets will also be emptied.

> Note: Due to permissioning the uninstall script uses the docker containers created by the installer in some of the clean up rather than issuing commands on the host machine. In the case that any of these containers are down you will have to clear the artefacts manually. This can be done by running git clean -xdf (allowing for permissions)

### IoT data

IoT data enters the demo via the manufacturers node-red flow which can be found at http://localhost:6002/node-red

> Note: Loading the insurer's policy page assigns the vehicle that the data being streamed by the sensor relates to.
> Note: In a session only one of each type of usage event is pushed to the blockchain to prevent unwanted duplicates when giving the demo. You can start a new demo by disconnecting and reconnecting your sensortag or by clicking the 'PUSH CONNECT EVENT' input node.

## Using your own sensortag

Load the manufacturer's node-red flow and double click on the blue node labelled 'IBM IoT'. Update the Device Id field to match your device's ID. You can find this ID using the TI SensorTag application available for iOS and Android and connecting your device via Bluetooth. Once the app has found your device click on it and select 'Sensor View' once in the sensor click the top cell to view the device configuration. In node-red press done to confirm your device ID and then deploy. Toggling the push to cloud button will then stream your sensor data into node-red and allow you to use the sensor to record usage events.

> Note: If you uninstall the demo, the next time your run the installer you will have to update the device ID again. This is as the flow is stored in a docker image.

## Using the demo without a sensortag

If you do not have a sensortag you can use the input nodes in the manufacturers node-red flow to fake connect and usage events by clicking the buttons on the side of the input nodes.
