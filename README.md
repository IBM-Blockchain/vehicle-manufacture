# Vehicle Lifecycle IoT Extension

This repository contains an application that adds IoT features and new views to the Hypeledger Composer vehicle lifeycle sample application.

To run this demonstration you should have installed:
- NodeJS v6.x.x
- Npm v3.x.x 
- Docker
- IoT sensortag (optional)

Currently this demo's installer is written to run only on MacOS

To install the necessary node modules for this demonstration you should run the following command:
```
npm install
```

You can then build the demonstration by in the packages/vehicle-lifecycle folder running the commands:
```
./build.sh
cat installers/hlfv1/install.sh | bash
```

This should open each of the demonstration pages in your default browser.

## Running the car builder application on your phone
The car builder application can be run on a smart phone by following the instructions available on the [ionic website](https://ionicframework.com/docs/intro/deploying/)

Once you have the application installed you can link it to the rest of the demo by on the car builder application home screen clicking the cog icon in the top right and then entering the IP address of you computer running the rest of the demo followed by :1880 (e.g. 0.0.0.0:1880). Then press the update button.

## Adding your IoT device to the Node-RED flow

If you are only going to run the demo once then you can simply in the "IoT Flow" tab drag in an "ibmiot" input and connect this to the compute event node. Set the authentication to quickstart, input type to device event and then enter the ID of your IoT device. Deploy your new Node-RED flow and refresh each of the tabs of the demo. 

If you wish to use the same IoT device with the demo more than once you can permantly add your device by in Node-RED using the menu to select export > clipboard then select the all flows tab and clicking export to clipboard. Paste this into the packages/vehicle-lifecycle/installers/hlfv1/flows.json file replacing all the existing content of the file.

## Running the demo without an IoT device

In the IoT flow of the Node-RED flow there are four inputs you can press to simulate IoT events: 'PUSH CONNECT_ATTEMPT', 'PUSH OVERHEATED', 'PUSH OIL_FREEZING' and 'PUSH CRASH'.
