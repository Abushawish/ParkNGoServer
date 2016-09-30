Created by Mohammed Abushawish

You will need Bluetooth beacons (I used Estimotes), a Bluetooth on-board diagnostics adapter (OBD), an Android device with an internet connect, and a server to run "ParkNGo_Server".

1) In index.js in "ParkNGo_Server", enter your Stripe key, then run the server.

2) In Constants.java in "ParkNGo", enter your server URL, your OBD MAC address and UUID, the Estimote's Bluetooth beacon UUID, the key for your Stripe account, and you may also change the required distance to the Bluetooth beacon depending on the sensitivity.

3) Run the ParkNGo app once to register and it will continue running in the background and place at window level.

4) Place Bluetooth beacon at window level at parking location and drive into parking spot.

5) Drive away from location to be charged automatically.

Write up about my project: https://www.dropbox.com/s/xm6bwzo3lzz5srq/Honours%20Project-%20Mohammed%20Abushawish%20-%20100857775.pdf?dl=0
