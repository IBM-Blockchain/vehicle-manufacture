# Vehicle manufacture IoT extension

## Prerequisites

- docker
- docker-compose
- node v8.9.x
- make
- g++
- jq

This demo has been tested to work on Ubuntu and MacOS.

## Setting up the demo

Clone this git repository and then use the scripts in the `scripts` folder to install and start the demo. There are two scripts for setting up the demo and two for tearing it down. First run `./scripts/install.sh` from the top level folder of the repository. This will install the smart contract's and CLI tool's node_modules. Ideally you should only have to run this command once. Next run `./scripts/start.sh`. This will bring up a Hyperledger Fabric network, register and enroll the identities and start the 4 applications used in this demo. Once the installer has finished running the applications will be available at the following locations:

- Car builder - http://localhost:6001
- Manufacturer - http://localhost:6002
  - Manufacturer Node Red - http://localhost:6002/node-red
- Regulator - http://localhost:6003
- Insurer - http://localhost:6004

### Common errors when setting up the demo
- Missing JQ
- Docker engine not running
- Channel creation fails as data from the demo being previously run has not been cleaned up

## Tearing down the demo
As mentioned in the previous section there are two scripts to teardown the demo. To simply stop the demo ready to run again use `./scripts/stop.sh`. This removes the Hyperledger Fabric network, identities and apps. Using this command means that you can run the start script to get up and running again without needing to reinstall. To cleanup complete run `./scripts/uninstall.sh`. This will remove the node_modules files created by the install script. To start the demo again after running this you will need to run install and start.

### IoT data

IoT data enters the demo via the manufacturers node-red flow which can be found at http://localhost:6002/node-red

> Note: Loading the insurer's policy page assigns the vehicle that the data being streamed by the sensor relates to.
> Note: In a session only one of each type of usage event is pushed to the blockchain to prevent unwanted duplicates when giving the demo. You can start a new demo by disconnecting and reconnecting your sensortag or if using the node-red generated data press the disconnect and connect inputs.

## Using your own sensortag

Load the manufacturer's node-red flow and double click on the blue node labelled 'IBM IoT'. Update the Device Id field to match your device's ID. You can find this ID using the TI SensorTag application available for iOS and Android and connecting your device via Bluetooth. Once the app has found your device click on it and select 'Sensor View' once in the sensor click the top cell to view the device configuration. In node-red press done to confirm your device ID and then deploy. Toggling the push to cloud button will then stream your sensor data into node-red and allow you to use the sensor to record usage events.

> Note: If you stop/uninstall the demo, the next time your run the installer you will have to update the device ID again. This is as the flow is stored in a docker image.

## Using the demo without a sensortag

If you do not have a sensortag you can use the input nodes in the manufacturers node-red flow. Press the connect input to start sending a stream of fake IoT data and then use the inputs below to push usage events.
