package org.apache.wookie.feature.nodewave;

import org.apache.wookie.feature.IFeature;


public class NodeWave implements IFeature {

	public String getName() {
		return "http://wave.google.com/node";
	}

	public String[] scripts() {
		return new String[]{"/wookie/shared/feature/nodewave/json2.js","/wookie/shared/feature/nodewave/socket.io.js","/wookie/shared/feature/nodewave/wave.js"};
	}

	public String[] stylesheets() {
		return null;
	}

}
