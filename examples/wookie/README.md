# Wave-Node

## Example using Apache Wookie

To run the example:

1. Start your redis server on the default port using:
    ./redis-server
2. Start the wave server using Node:
    cd server
    node server.js
3. Configure Wookie:
    (a) Add the feature/nodewave folder to {wookie}/features
    (b) Add the line "org.apache.wookie.feature.nodewave.NodeWave = http:\/\/   wave.google.com\/node" to local.features.properties
    (c) Apply the Wookie Patch; this just makes the viewer available in the Widget
    (d) Add the "nodechat" folder to {wookie}/widgets
4. Start Wookie
5. Go to the Wookie gallery and view the demo of the Nodechat widget.

